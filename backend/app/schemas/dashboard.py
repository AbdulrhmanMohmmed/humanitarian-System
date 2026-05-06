from pydantic import BaseModel
from typing import List

class DashboardStats(BaseModel):
    total_beneficiaries: int
    active_projects: int
    total_employees: int
    total_grants: float
    total_spent: float
    total_distributions: int
    total_cash_transfers: float
    pending_leaves: int
    low_stock_items: int
    active_surveys: int

class BeneficiaryByGovernorate(BaseModel):
    governorate: str
    count: int

class ProjectBySector(BaseModel):
    sector: str
    count: int

class MonthlyTransaction(BaseModel):
    month: str
    income: float
    expense: float
