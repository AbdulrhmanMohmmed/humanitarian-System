from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import Warehouse, InventoryItem, Distribution, DistributionItem, User
from app.schemas import (
    WarehouseCreate, WarehouseOut, InventoryItemCreate, InventoryItemOut,
    DistributionCreate, DistributionOut, DistributionUpdate,
    DistributionItemCreate, DistributionItemOut, DistributionItemUpdate
)
from app.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/inventory", tags=["المخازن وسلسلة الإمداد"])


# Warehouses
@router.get("/warehouses", response_model=List[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Warehouse).order_by(Warehouse.created_at.desc()).all()


@router.post("/warehouses", response_model=WarehouseOut)
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Warehouse).filter(Warehouse.code == data.code).first():
        raise HTTPException(status_code=400, detail="رمز المخزن موجود بالفعل")
    w = Warehouse(**data.model_dump(), manager_id=current_user.id)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.delete("/warehouses/{warehouse_id}")
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="المخزن غير موجود")
    db.delete(w)
    db.commit()
    return {"message": "تم حذف المخزن بنجاح"}


# Inventory Items
@router.get("/items", response_model=List[InventoryItemOut])
def list_items(
    warehouse_id: Optional[int] = None,
    category: Optional[str] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(InventoryItem)
    if warehouse_id:
        query = query.filter(InventoryItem.warehouse_id == warehouse_id)
    if category:
        query = query.filter(InventoryItem.category == category)
    if low_stock:
        query = query.filter(InventoryItem.quantity <= InventoryItem.min_stock)
    return query.order_by(InventoryItem.created_at.desc()).all()


@router.get("/items/stats")
def inventory_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_items = db.query(InventoryItem).count()
    low_stock = db.query(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.min_stock).count()
    total_value = db.query(func.sum(InventoryItem.quantity * InventoryItem.unit_cost)).scalar() or 0
    by_category = db.query(InventoryItem.category, func.count(InventoryItem.id)).group_by(InventoryItem.category).all()
    return {
        "total_items": total_items,
        "low_stock": low_stock,
        "total_value": total_value,
        "by_category": [{"category": str(c), "count": n} for c, n in by_category],
    }


@router.post("/items", response_model=InventoryItemOut)
def create_item(data: InventoryItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = InventoryItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=InventoryItemOut)
def update_item(item_id: int, data: InventoryItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="المادة غير موجودة")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="المادة غير موجودة")
    db.delete(item)
    db.commit()
    return {"message": "تم حذف المادة بنجاح"}


# Distributions
@router.get("/distributions", response_model=List[DistributionOut])
def list_distributions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Distribution)
    if status:
        query = query.filter(Distribution.status == status)
    return query.order_by(Distribution.created_at.desc()).all()


@router.post("/distributions", response_model=DistributionOut)
def create_distribution(data: DistributionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = Distribution(**data.model_dump(), created_by=current_user.id)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.put("/distributions/{dist_id}", response_model=DistributionOut)
def update_distribution(
    dist_id: int,
    data: DistributionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    d = db.query(Distribution).filter(Distribution.id == dist_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="التوزيع غير موجود")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(d, key, value)
    db.commit()
    db.refresh(d)
    return d


@router.get("/distributions/{dist_id}/items", response_model=List[DistributionItemOut])
def list_distribution_items(
    dist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(DistributionItem).filter(DistributionItem.distribution_id == dist_id).all()


@router.post("/distributions/{dist_id}/items", response_model=DistributionItemOut)
def add_distribution_item(
    dist_id: int,
    data: DistributionItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    d = db.query(Distribution).filter(Distribution.id == dist_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="التوزيع غير موجود")
    item = DistributionItem(distribution_id=dist_id, **data.model_dump())
    db.add(item)
    d.total_beneficiaries = db.query(DistributionItem).filter(DistributionItem.distribution_id == dist_id).count() + 1
    db.commit()
    db.refresh(item)
    return item


@router.put("/distribution-items/{item_id}", response_model=DistributionItemOut)
def update_distribution_item(
    item_id: int,
    data: DistributionItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(DistributionItem).filter(DistributionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="سجل التوزيع غير موجود")
    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("received") and not update_data.get("received_date"):
        update_data["received_date"] = datetime.now(timezone.utc)
    for key, value in update_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/distribution-items/{item_id}")
def delete_distribution_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(DistributionItem).filter(DistributionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="سجل التوزيع غير موجود")
    dist_id = item.distribution_id
    db.delete(item)
    db.commit()
    d = db.query(Distribution).filter(Distribution.id == dist_id).first()
    if d:
        d.total_beneficiaries = db.query(DistributionItem).filter(DistributionItem.distribution_id == dist_id).count()
        db.commit()
    return {"message": "تم حذف سجل المستفيد من التوزيع"}


@router.delete("/distributions/{dist_id}")
def delete_distribution(dist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = db.query(Distribution).filter(Distribution.id == dist_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="التوزيع غير موجود")
    db.delete(d)
    db.commit()
    return {"message": "تم حذف التوزيع بنجاح"}
