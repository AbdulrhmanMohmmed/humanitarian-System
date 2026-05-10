"""
IATI 2.03 XML export service.
Generates IATI-compliant XML from projects, transactions, and organizations.
Reference: https://iatistandard.org/en/iati-standard/203/
"""

from datetime import date
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString

from sqlalchemy.orm import Session

from app.models import Grant, Project, Transaction


def _el(parent: Element, tag: str, text: str = "", attrib: dict | None = None, **attribs) -> Element:
    """Helper to create a sub-element with text and attributes."""
    merged = {**(attrib or {}), **attribs}
    e = SubElement(parent, tag, merged)
    if text:
        e.text = str(text)
    return e


def generate_activities_xml(
    db: Session,
    *,
    org_name: str = "HIAOS Organization",
    org_ref: str = "HIAOS",
) -> str:
    """Generate IATI Activities XML for all active projects."""
    root = Element("iati-activities", {
        "version": "2.03",
        "generated-datetime": date.today().isoformat(),
    })

    projects = db.query(Project).filter(Project.status == "active", Project.deleted_at.is_(None)).all()

    for project in projects:
        activity = SubElement(root, "iati-activity", {
            "last-updated-datetime": (
                project.updated_at.isoformat() if project.updated_at else date.today().isoformat()
            ),
            "default-currency": "USD",
        })

        _el(activity, "iati-identifier", f"{org_ref}-{project.id}")

        reporting_org = _el(activity, "reporting-org", ref=org_ref, type="21")
        _el(reporting_org, "narrative", org_name)

        title = _el(activity, "title")
        _el(title, "narrative", project.name or "")

        if project.description:
            desc = _el(activity, "description")
            _el(desc, "narrative", project.description)

        if project.sector:
            _el(activity, "sector", code=project.sector)

        if project.start_date:
            _el(activity, "activity-date", attrib={"iso-date": project.start_date.isoformat(), "type": "1"})
        if project.end_date:
            _el(activity, "activity-date", attrib={"iso-date": project.end_date.isoformat(), "type": "3"})

        status_map = {"active": "2", "completed": "3", "planned": "1"}
        _el(activity, "activity-status", code=status_map.get(project.status, "2"))

        if project.budget:
            budget_el = _el(activity, "budget", type="1")
            period_start = _el(budget_el, "period-start")
            if project.start_date:
                period_start.set("iso-date", project.start_date.isoformat())
            period_end = _el(budget_el, "period-end")
            if project.end_date:
                period_end.set("iso-date", project.end_date.isoformat())
            value_el = _el(budget_el, "value", str(project.budget))
            value_el.set("currency", "USD")
            value_el.set("value-date", date.today().isoformat())

        if project.governorate:
            location = _el(activity, "location")
            loc_name = _el(location, "name")
            _el(loc_name, "narrative", project.governorate)
            if project.latitude and project.longitude:
                point = _el(location, "point", srsName="http://www.opengis.net/def/crs/EPSG/0/4326")
                _el(point, "pos", f"{project.latitude} {project.longitude}")

    raw = tostring(root, encoding="unicode", xml_declaration=False)
    return parseString(f'<?xml version="1.0" encoding="UTF-8"?>{raw}').toprettyxml(indent="  ")


def generate_organization_xml(
    db: Session,
    *,
    org_name: str = "HIAOS Organization",
    org_ref: str = "HIAOS",
) -> str:
    """Generate IATI Organization XML with total budgets from grants."""
    root = Element("iati-organisations", {
        "version": "2.03",
        "generated-datetime": date.today().isoformat(),
    })

    org = SubElement(root, "iati-organisation", {
        "last-updated-datetime": date.today().isoformat(),
        "default-currency": "USD",
    })
    _el(org, "organisation-identifier", org_ref)
    name_el = _el(org, "name")
    _el(name_el, "narrative", org_name)

    grants = db.query(Grant).filter(Grant.deleted_at.is_(None)).all()
    for grant in grants:
        budget_el = _el(org, "total-budget")
        if grant.start_date:
            _el(budget_el, "period-start", attrib={"iso-date": grant.start_date.isoformat()})
        if grant.end_date:
            _el(budget_el, "period-end", attrib={"iso-date": grant.end_date.isoformat()})
        value_el = _el(budget_el, "value", str(grant.amount))
        value_el.set("currency", str(grant.currency.value) if hasattr(grant.currency, "value") else "USD")
        value_el.set("value-date", date.today().isoformat())

    raw = tostring(root, encoding="unicode", xml_declaration=False)
    return parseString(f'<?xml version="1.0" encoding="UTF-8"?>{raw}').toprettyxml(indent="  ")
