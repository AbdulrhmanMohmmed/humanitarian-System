from fastapi import APIRouter, Depends
from typing import Optional
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/api/locations", tags=["Yemen Locations (Cascading)"])

YEMEN_LOCATIONS = {
    "صنعاء": {
        "districts": {
            "بني الحارث": ["حارة العروبة", "حارة النصر", "حارة السلام"],
            "معين": ["شارع الزبيري", "شارع هائل", "منطقة القاع"],
            "الصافية": ["شارع الستين", "منطقة حدة", "منطقة الأصبحي"],
            "شعوب": ["حارة المطار", "حارة الفليحي", "حارة بيت مياد"],
            "السبعين": ["حي الجامعة", "حي الأمانة", "حي التحرير"],
        },
    },
    "عدن": {
        "districts": {
            "كريتر": ["حافون", "صيرة", "العيدروس"],
            "المعلا": ["الشيخ عثمان", "دار سعد", "المنصورة"],
            "التواهي": ["ميناء عدن", "الفتح", "رأس مربط"],
            "خور مكسر": ["المطار", "البريقة", "جولد مور"],
        },
    },
    "تعز": {
        "districts": {
            "القاهرة": ["باب الكبير", "الحوبان", "المسبح"],
            "صالة": ["شارع جمال", "شارع 26 سبتمبر", "المدينة القديمة"],
            "المظفر": ["الروضة", "الضبوعة", "النقيلين"],
            "المسراخ": ["العصيفرة", "الدمنة", "المخادر"],
            "شرعب السلام": ["القبيطة", "الحصين", "النعمان"],
        },
    },
    "الحديدة": {
        "districts": {
            "المدينة": ["الميناء", "الكورنيش", "الدريهمي"],
            "باجل": ["المنظر", "بني قيس", "الصالحية"],
            "الخوخة": ["المخا", "الجاح", "الحسينية"],
            "زبيد": ["المدينة القديمة", "الحسينية", "المنصورية"],
        },
    },
    "إب": {
        "districts": {
            "المدينة": ["الشهاري", "الجوبة", "المشنة"],
            "جبلة": ["القفر", "المخادر", "بعدان"],
            "يريم": ["العدين", "السياني", "حبيش"],
            "العدين": ["القاعدة", "المشنة", "الظهار"],
        },
    },
    "حضرموت": {
        "districts": {
            "المكلا": ["فوة", "بويش", "ديس المشرقية"],
            "سيئون": ["تريم", "القطن", "شبام"],
            "شبام": ["المدينة القديمة", "حوطة سلطان"],
            "تريم": ["عينات", "القرن", "مشطة"],
        },
    },
    "مأرب": {
        "districts": {
            "المدينة": ["الروضة", "العبر", "صرواح"],
            "مأرب الوادي": ["الجوبة", "رغوان", "حريب"],
            "صرواح": ["المحجل", "المسيل", "وادي عبيدة"],
        },
    },
    "الجوف": {
        "districts": {
            "الحزم": ["المتون", "خب والشعف", "برط"],
            "المتون": ["الغيل", "المصلوب", "الزاهر"],
        },
    },
    "صعدة": {
        "districts": {
            "المدينة": ["الصفراء", "سحار", "حيدان"],
            "حيدان": ["غمر", "رازح", "منبه"],
        },
    },
    "ذمار": {
        "districts": {
            "المدينة": ["عنس", "المنار", "جهران"],
            "عنس": ["ميفعة عنس", "جبل الشرق", "وصاب"],
        },
    },
    "البيضاء": {
        "districts": {
            "المدينة": ["رداع", "القريشية", "المقاطرة"],
            "رداع": ["الطفة", "ولد ربيع", "العرش"],
        },
    },
    "لحج": {
        "districts": {
            "الحوطة": ["تبن", "طور الباحة", "المسيمير"],
            "طور الباحة": ["الحبيلين", "المقاطرة", "المفلحي"],
        },
    },
    "أبين": {
        "districts": {
            "زنجبار": ["خنفر", "لودر", "المحفد"],
            "لودر": ["جعار", "شقرة", "أحور"],
        },
    },
    "شبوة": {
        "districts": {
            "عتق": ["بيحان", "عسيلان", "نصاب"],
            "بيحان": ["عين", "الروضة", "حبان"],
        },
    },
    "المهرة": {
        "districts": {
            "الغيضة": ["حصوين", "سيحوت", "قشن"],
            "حصوين": ["منعر", "حوف", "الشحن"],
        },
    },
    "سقطرى": {
        "districts": {
            "حديبو": ["قلنسية", "عبد الكوري"],
        },
    },
    "الضالع": {
        "districts": {
            "الضالع": ["قعطبة", "دمت", "الحصين"],
            "قعطبة": ["جبن", "العزارق", "الشعيب"],
        },
    },
    "عمران": {
        "districts": {
            "عمران": ["ثلاء", "حبور ظليمة", "خمر"],
            "ثلاء": ["كحلان عفار", "السودة", "حوث"],
        },
    },
    "حجة": {
        "districts": {
            "حجة": ["عبس", "حرض", "ميدي"],
            "عبس": ["بكيل المير", "مستبأ", "أفلح اليمن"],
        },
    },
    "ريمة": {
        "districts": {
            "الجبين": ["بلاد الطعام", "كسمة", "الجعفرية"],
            "الجعفرية": ["مزهر", "السلفية"],
        },
    },
    "المحويت": {
        "districts": {
            "المحويت": ["الرجم", "الطويلة", "بني سعد"],
            "الطويلة": ["حفاش", "ملحان"],
        },
    },
}


@router.get("/governorates")
def get_governorates(current_user: User = Depends(get_current_user)):
    return list(YEMEN_LOCATIONS.keys())


@router.get("/districts/{governorate}")
def get_districts(governorate: str, current_user: User = Depends(get_current_user)):
    if governorate not in YEMEN_LOCATIONS:
        return []
    return list(YEMEN_LOCATIONS[governorate]["districts"].keys())


@router.get("/subdistricts/{governorate}/{district}")
def get_subdistricts(governorate: str, district: str, current_user: User = Depends(get_current_user)):
    if governorate not in YEMEN_LOCATIONS:
        return []
    districts = YEMEN_LOCATIONS[governorate].get("districts", {})
    return districts.get(district, [])


@router.get("/full-tree")
def get_full_location_tree(current_user: User = Depends(get_current_user)):
    return YEMEN_LOCATIONS


@router.get("/search")
def search_locations(q: str, current_user: User = Depends(get_current_user)):
    results = []
    for gov, data in YEMEN_LOCATIONS.items():
        if q in gov:
            results.append({"type": "governorate", "name": gov})
        for dist, villages in data["districts"].items():
            if q in dist:
                results.append({"type": "district", "name": dist, "governorate": gov})
            for v in villages:
                if q in v:
                    results.append({"type": "village", "name": v, "district": dist, "governorate": gov})
    return results[:20]
