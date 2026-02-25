from fastapi import FastAPI, Request, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
import os
import json
import csv
import io
from dotenv import load_dotenv

# Import from our new modules
from sqlalchemy.orm import Session
from database import get_db, ValidationAttemptModel
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

load_dotenv()

app = FastAPI(title="Data Quality API", description="API for validating user data")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserValidationRequest(BaseModel):
    email: EmailStr
    age: int = Field(ge=18, le=100, description="Age must be between 18 and 100")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- AUTHENTICATION DEPENDENCY ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Simple check against our ENV admin
    admin_env = os.getenv("ADMIN_USERNAME")
    if username != admin_env:
        raise credentials_exception
        
    return username

# --- LOGIN ENDPOINT ---
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    admin_user = os.getenv("ADMIN_USERNAME")
    admin_pass = os.getenv("ADMIN_PASSWORD")
    
    # In a real db, we would query the User table and verify the hash.
    # Here, we just check against the .env variables.
    if form_data.username != admin_user or form_data.password != admin_pass:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin_user}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- EXCEPTION HANDLER ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    
    # We must instantiate our own DB session here because it's outside normal dependency injection
    from database import SessionLocal
    db = SessionLocal()
    try:
        email = str(body.get("email", "Unknown"))
        age_str = str(body.get("age", "Unknown"))
        
        severity = "Medium"
        
        # Check if age is negative
        try:
            if int(age_str) < 0:
                severity = "High"
        except (ValueError, TypeError):
            pass
            
        # Check previous failure count
        if severity != "High":
            previous_failures = db.query(ValidationAttemptModel).filter(
                ValidationAttemptModel.email == email,
                ValidationAttemptModel.status == "Failed"
            ).count()
            
            if previous_failures >= 3:
                severity = "High"
                
        attempt = ValidationAttemptModel(
            email=email,
            age=age_str,
            status="Failed",
            severity=severity,
            errors=json.dumps([{"msg": err["msg"], "type": err["type"]} for err in exc.errors()])
        )
        db.add(attempt)
        db.commit()
    finally:
        db.close()
        
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# --- PUBLIC ENDPOINT ---
@app.post("/validate")
async def validate_user(user: UserValidationRequest, db: Session = Depends(get_db)):
    attempt = ValidationAttemptModel(
        email=user.email,
        age=str(user.age),
        status="Success",
        severity="Normal",
        errors="[]"
    )
    db.add(attempt)
    db.commit()
    
    return {
        "status": "success",
        "message": "User data is valid",
        "data": {
            "email": user.email,
            "age": user.age
        }
    }

# --- PROTECTED ENDPOINT ---
@app.get("/attempts")
async def get_attempts(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Protected endpoint to retrieve all validation attempts for the dashboard."""
    attempts = db.query(ValidationAttemptModel).all()
    # Serialize back to dicts for the frontend
    result = []
    for a in attempts:
        result.append({
            "id": a.id,
            "timestamp": a.timestamp.isoformat() if a.timestamp else "",
            "email": a.email,
            "age": a.age,
            "status": a.status,
            "severity": getattr(a, 'severity', 'Normal') or 'Normal',
            "errors": json.loads(a.errors) if a.errors else []
        })
    return result

@app.get("/api/metrics")
async def get_metrics(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Protected endpoint to compute system health metrics."""
    total_attempts = db.query(ValidationAttemptModel).count()
    total_passed = db.query(ValidationAttemptModel).filter(
        ValidationAttemptModel.status == "Success",
        (ValidationAttemptModel.severity == "Normal") | (ValidationAttemptModel.severity == None)
    ).count()
    
    total_failed = db.query(ValidationAttemptModel).filter(
        ValidationAttemptModel.status == "Failed",
        ValidationAttemptModel.severity.in_(["High", "Medium"])
    ).count()
    
    success_rate = 0
    if total_attempts > 0:
        success_rate = round((total_passed / total_attempts) * 100)
        
    return {
        "total_attempts": total_attempts,
        "total_passed": total_passed,
        "total_failed": total_failed,
        "success_rate": success_rate
    }

@app.get("/api/export")
async def export_data(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Protected endpoint to export all validation attempts as a CSV file."""
    attempts = db.query(ValidationAttemptModel).all()
    
    # Create an in-memory string buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write the header row
    writer.writerow(["ID", "Timestamp", "Email", "Age", "Status", "Severity", "Errors"])
    
    # Write the data rows
    for a in attempts:
        # Reformat the timestamp for better readability in Excel/Numbers
        timestamp_str = a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else ""
        
        # We need to extract the actual error message string out of the JSON list if there are errors
        error_str = ""
        if a.errors:
            try:
                error_list = json.loads(a.errors)
                if error_list:
                    # Just join the messages together
                    error_str = " | ".join([err.get("msg", "") for err in error_list])
            except:
                error_str = a.errors
                
        severity_val = getattr(a, 'severity', 'Normal') or 'Normal'
        writer.writerow([a.id, timestamp_str, a.email, a.age, a.status, severity_val, error_str])
        
    # Get the value as a string and close the buffer
    csv_data = output.getvalue()
    output.close()
    
    # Return as a specialized Response so the browser interprets it as a file download
    headers = {
        "Content-Disposition": "attachment; filename=data_quality_report.csv"
    }
    return Response(content=csv_data, media_type="text/csv", headers=headers)

@app.get("/")
async def root():
    return {"message": "Welcome to the Data Quality API. Use POST /validate to check user data."}

# Old code removed
