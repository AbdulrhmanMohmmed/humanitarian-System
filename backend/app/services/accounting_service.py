"""Accounting service — Chart of Accounts, double-entry journaling, budget lines."""
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.accounting import Account, JournalEntry, JournalLine, BudgetLine


def seed_chart_of_accounts(db: Session) -> list[dict]:
    """Seed default humanitarian Chart of Accounts."""
    if db.query(Account).count() > 0:
        return []

    defaults = [
        ("1000", "Assets", "الأصول", "asset"),
        ("1100", "Cash & Bank", "النقد والبنك", "asset"),
        ("1200", "Accounts Receivable", "الذمم المدينة", "asset"),
        ("1300", "Inventory", "المخزون", "asset"),
        ("2000", "Liabilities", "الخصوم", "liability"),
        ("2100", "Accounts Payable", "الذمم الدائنة", "liability"),
        ("2200", "Accrued Expenses", "مصروفات مستحقة", "liability"),
        ("3000", "Equity / Net Assets", "صافي الأصول", "equity"),
        ("3100", "Unrestricted Funds", "أموال غير مقيدة", "equity"),
        ("3200", "Restricted Funds", "أموال مقيدة", "equity"),
        ("4000", "Income", "الإيرادات", "income"),
        ("4100", "Grant Income", "إيرادات المنح", "income"),
        ("4200", "Donation Income", "إيرادات التبرعات", "income"),
        ("4300", "Other Income", "إيرادات أخرى", "income"),
        ("5000", "Expenses", "المصروفات", "expense"),
        ("5100", "Program Expenses", "مصروفات البرامج", "expense"),
        ("5200", "Staff Costs", "تكاليف الموظفين", "expense"),
        ("5300", "Office & Admin", "مكتبية وإدارية", "expense"),
        ("5400", "Travel & Transport", "سفر ونقل", "expense"),
        ("5500", "Procurement", "مشتريات", "expense"),
        ("5600", "Distribution Costs", "تكاليف التوزيع", "expense"),
    ]
    accounts = []
    for code, name, name_ar, atype in defaults:
        acct = Account(code=code, name=name, name_ar=name_ar, account_type=atype)
        db.add(acct)
        accounts.append({"code": code, "name": name})
    db.commit()
    return accounts


def create_journal_entry(
    db: Session,
    reference: str,
    entry_date: date,
    description: str,
    lines: list[dict],
    created_by: int,
    transaction_id: int | None = None,
    grant_id: int | None = None,
    project_id: int | None = None,
) -> dict:
    """Create a balanced double-entry journal entry.
    Each line dict: {account_id, debit, credit, description?}
    """
    total_debit = sum(l.get("debit", 0) for l in lines)
    total_credit = sum(l.get("credit", 0) for l in lines)
    if abs(total_debit - total_credit) > 0.01:
        return {"error": f"Entry not balanced: debit={total_debit}, credit={total_credit}"}

    entry = JournalEntry(
        reference=reference,
        date=entry_date,
        description=description,
        transaction_id=transaction_id,
        grant_id=grant_id,
        project_id=project_id,
        created_by=created_by,
    )
    db.add(entry)
    db.flush()

    for line in lines:
        db.add(JournalLine(
            journal_entry_id=entry.id,
            account_id=line["account_id"],
            debit=line.get("debit", 0),
            credit=line.get("credit", 0),
            description=line.get("description", ""),
        ))
    db.commit()

    return {"id": entry.id, "reference": reference, "total_debit": total_debit, "total_credit": total_credit}


def get_account_balance(db: Session, account_id: int) -> dict:
    result = (
        db.query(
            func.coalesce(func.sum(JournalLine.debit), 0),
            func.coalesce(func.sum(JournalLine.credit), 0),
        )
        .join(JournalEntry)
        .filter(JournalLine.account_id == account_id, JournalEntry.is_posted == True)
        .first()
    )
    total_debit, total_credit = result
    return {"account_id": account_id, "total_debit": total_debit, "total_credit": total_credit, "balance": total_debit - total_credit}


def get_trial_balance(db: Session) -> list[dict]:
    results = (
        db.query(
            Account.id, Account.code, Account.name, Account.account_type,
            func.coalesce(func.sum(JournalLine.debit), 0),
            func.coalesce(func.sum(JournalLine.credit), 0),
        )
        .outerjoin(JournalLine, JournalLine.account_id == Account.id)
        .outerjoin(JournalEntry, JournalEntry.id == JournalLine.journal_entry_id)
        .group_by(Account.id)
        .order_by(Account.code)
        .all()
    )
    return [
        {
            "account_id": r[0], "code": r[1], "name": r[2], "type": r[3],
            "debit": float(r[4]), "credit": float(r[5]), "balance": float(r[4] - r[5]),
        }
        for r in results
    ]
