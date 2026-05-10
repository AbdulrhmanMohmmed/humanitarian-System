"""Accounting models: Chart of Accounts, Journal Entries (double-entry), Budget Lines."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Account(Base):
    """Chart of Accounts — hierarchical account tree."""
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))
    account_type = Column(String(50), nullable=False)  # asset, liability, equity, income, expense
    parent_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    children = relationship("Account", backref="parent", remote_side="Account.id")
    journal_lines = relationship("JournalLine", back_populates="account")


class JournalEntry(Base):
    """Double-entry bookkeeping journal entry (header)."""
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(100), index=True)
    date = Column(Date, nullable=False)
    description = Column(Text)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    grant_id = Column(Integer, ForeignKey("grants.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    is_posted = Column(Boolean, default=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    lines = relationship("JournalLine", back_populates="journal_entry", cascade="all, delete-orphan")


class JournalLine(Base):
    """Individual debit/credit line within a journal entry."""
    __tablename__ = "journal_lines"
    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    debit = Column(Float, default=0)
    credit = Column(Float, default=0)
    currency = Column(String(10), default="USD")
    description = Column(Text)

    journal_entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("Account", back_populates="journal_lines")


class BudgetLine(Base):
    """Detailed budget lines linking activities to grants."""
    __tablename__ = "budget_lines"
    id = Column(Integer, primary_key=True, index=True)
    grant_id = Column(Integer, ForeignKey("grants.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    description = Column(String(500), nullable=False)
    budgeted_amount = Column(Float, nullable=False, default=0)
    spent_amount = Column(Float, default=0)
    currency = Column(String(10), default="USD")
    period_start = Column(Date)
    period_end = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)


class DonorReportTemplate(Base):
    """Donor-specific report templates (USAID, ECHO, UN, etc.)."""
    __tablename__ = "donor_report_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    donor_name = Column(String(255))
    template_type = Column(String(50))  # financial, narrative, combined
    sections = Column(Text)  # JSON array of section definitions
    format = Column(String(20), default="excel")  # excel, pdf, word
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
