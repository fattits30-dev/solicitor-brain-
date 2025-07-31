import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)


class TemplatesService:
    """Service for managing legal document templates"""

    def __init__(self):
        self.templates_dir = Path("templates")
        self.templates_dir.mkdir(exist_ok=True)

        # Create subdirectories for different template categories
        self.categories = ["contracts", "letters", "court_forms", "agreements", "notices", "wills"]
        for category in self.categories:
            (self.templates_dir / category).mkdir(exist_ok=True)

        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True
        )

        # Create default templates if they don't exist
        self._create_default_templates()

    def _create_default_templates(self):
        """Create default legal document templates"""
        default_templates = {
            "letters/client_engagement.html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { margin-bottom: 30px; }
        .date { text-align: right; margin-bottom: 20px; }
        .recipient { margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .signature { margin-top: 50px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ firm_name }}</h1>
        <p>{{ firm_address }}</p>
        <p>Tel: {{ firm_phone }} | Email: {{ firm_email }}</p>
    </div>

    <div class="date">{{ date }}</div>

    <div class="recipient">
        <p>{{ client_name }}<br>
        {{ client_address }}</p>
    </div>

    <p>Dear {{ client_name }},</p>

    <h2>Engagement Letter - {{ matter_description }}</h2>

    <div class="content">
        <p>Thank you for instructing {{ firm_name }} to act on your behalf in relation to {{ matter_description }}.</p>

        <p>I am writing to confirm the basis on which we will act for you and to set out our terms of engagement.</p>

        <h3>Scope of Work</h3>
        <p>{{ scope_of_work }}</p>

        <h3>Fee Arrangement</h3>
        <p>Our fees for this matter will be charged as follows:</p>
        <p>{{ fee_arrangement }}</p>

        <h3>Estimated Costs</h3>
        <p>{{ estimated_costs }}</p>

        <h3>Timescale</h3>
        <p>{{ estimated_timeline }}</p>

        <p>Please sign and return one copy of this letter to confirm your agreement to these terms.</p>
    </div>

    <div class="signature">
        <p>Yours sincerely,</p>
        <br><br>
        <p>{{ solicitor_name }}<br>
        {{ solicitor_title }}<br>
        {{ firm_name }}</p>
    </div>
</body>
</html>
            """,

            "contracts/nda_template.html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.8; }
        h1 { text-align: center; text-transform: uppercase; }
        .clause { margin: 20px 0; }
        .sub-clause { margin-left: 20px; }
        .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
    </style>
</head>
<body>
    <h1>Non-Disclosure Agreement</h1>

    <p>This Agreement is entered into on {{ date }} between:</p>

    <div class="clause">
        <p>(1) <strong>{{ party1_name }}</strong> of {{ party1_address }} ("Disclosing Party"); and</p>
        <p>(2) <strong>{{ party2_name }}</strong> of {{ party2_address }} ("Receiving Party").</p>
    </div>

    <h2>WHEREAS:</h2>
    <p>The Disclosing Party wishes to disclose certain confidential information to the Receiving Party for the purpose of {{ purpose }}.</p>

    <h2>NOW THEREFORE, the parties agree as follows:</h2>

    <div class="clause">
        <h3>1. Definition of Confidential Information</h3>
        <p>"Confidential Information" means {{ confidential_info_definition }}</p>
    </div>

    <div class="clause">
        <h3>2. Obligations of Receiving Party</h3>
        <p>The Receiving Party agrees to:</p>
        <div class="sub-clause">
            <p>(a) maintain the confidentiality of the Confidential Information;</p>
            <p>(b) not disclose the Confidential Information to any third parties;</p>
            <p>(c) use the Confidential Information solely for the Purpose.</p>
        </div>
    </div>

    <div class="clause">
        <h3>3. Term</h3>
        <p>This Agreement shall remain in effect for {{ term_years }} years from the date first written above.</p>
    </div>

    <div class="clause">
        <h3>4. Governing Law</h3>
        <p>This Agreement shall be governed by the laws of England and Wales.</p>
    </div>

    <div class="signature-block">
        <div>
            <p>_______________________<br>
            {{ party1_signatory }}<br>
            For and on behalf of<br>
            {{ party1_name }}</p>
        </div>
        <div>
            <p>_______________________<br>
            {{ party2_signatory }}<br>
            For and on behalf of<br>
            {{ party2_name }}</p>
        </div>
    </div>
</body>
</html>
            """,

            "court_forms/witness_statement.html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .court-header { border: 2px solid black; padding: 10px; margin-bottom: 20px; }
        .statement { margin: 20px 0; }
        .paragraph { margin: 10px 0; }
        .truth-statement { margin-top: 30px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="court-header">
        <p style="text-align: right;">Case No: {{ case_number }}</p>
        <p style="text-align: center;">
            IN THE {{ court_name }}<br>
            {{ court_division }}
        </p>
        <p>BETWEEN:</p>
        <p style="text-align: center;">{{ claimant_name }}<br>Claimant</p>
        <p style="text-align: center;">-and-</p>
        <p style="text-align: center;">{{ defendant_name }}<br>Defendant</p>
    </div>

    <h1 style="text-align: center;">WITNESS STATEMENT OF {{ witness_name }}</h1>

    <div class="statement">
        <p class="paragraph">1. I, {{ witness_name }}, of {{ witness_address }}, {{ witness_occupation }}, make this statement in support of the {{ party_supporting }}.</p>

        <p class="paragraph">2. The facts and matters set out in this statement are within my own knowledge unless otherwise stated, and I believe them to be true.</p>

        <p class="paragraph">3. {{ statement_content }}</p>
    </div>

    <div class="truth-statement">
        <p>I believe that the facts stated in this witness statement are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.</p>
    </div>

    <div style="margin-top: 50px;">
        <p>Signed: _______________________</p>
        <p>{{ witness_name }}</p>
        <p>Dated: {{ date }}</p>
    </div>
</body>
</html>
            """
        }

        for path, content in default_templates.items():
            template_path = self.templates_dir / path
            if not template_path.exists():
                template_path.write_text(content)

    async def get_template_categories(self) -> list[str]:
        """Get list of template categories"""
        return self.categories

    async def get_templates_by_category(self, category: str) -> list[dict[str, Any]]:
        """Get all templates in a category"""
        category_path = self.templates_dir / category
        if not category_path.exists():
            return []

        templates: list[dict[str, Any]] = []
        for template_file in category_path.glob("*.html"):
            # Extract template metadata from filename and content
            templates.append({
                "id": template_file.stem,
                "name": template_file.stem.replace("_", " ").title(),
                "category": category,
                "filename": template_file.name,
                "path": str(template_file.relative_to(self.templates_dir))
            })

        return templates

    async def get_template(self, template_path: str) -> dict[str, Any] | None:
        """Get a specific template"""
        full_path = self.templates_dir / template_path
        if not full_path.exists():
            return None

        content = full_path.read_text()

        # Extract variables from template
        from jinja2 import meta
        ast = self.env.parse(content)
        variables = list(meta.find_undeclared_variables(ast))

        return {
            "path": template_path,
            "content": content,
            "variables": variables,
            "name": full_path.stem.replace("_", " ").title()
        }

    async def render_template(self, template_path: str, data: dict[str, Any]) -> str:
        """Render a template with provided data"""
        template = self.env.get_template(template_path)

        # Add default data
        default_data = {
            "date": datetime.now().strftime("%d %B %Y"),
            "firm_name": "Solicitor & Associates",
            "firm_address": "123 Legal Street, London, EC1A 1BB",
            "firm_phone": "020 1234 5678",
            "firm_email": "info@solicitor.co.uk"
        }

        # Merge with provided data
        render_data = {**default_data, **data}

        return template.render(**render_data)

    async def create_custom_template(self, name: str, category: str, content: str) -> dict[str, Any]:
        """Create a new custom template"""
        filename = name.lower().replace(" ", "_") + ".html"
        template_path = self.templates_dir / category / filename

        # Save template
        template_path.write_text(content)

        return {
            "id": template_path.stem,
            "name": name,
            "category": category,
            "path": str(template_path.relative_to(self.templates_dir)),
            "created": datetime.now().isoformat()
        }

    async def update_template(self, template_path: str, content: str) -> bool:
        """Update an existing template"""
        full_path = self.templates_dir / template_path
        if not full_path.exists():
            return False

        full_path.write_text(content)
        return True

    async def delete_template(self, template_path: str) -> bool:
        """Delete a template"""
        full_path = self.templates_dir / template_path
        if not full_path.exists():
            return False

        full_path.unlink()
        return True

    async def get_template_preview(self, template_path: str, sample_data: dict[str, Any] | None = None) -> str:
        """Get a preview of a template with sample data"""
        if sample_data is None:
            # Generate sample data based on template variables
            template_info = await self.get_template(template_path)
            if not template_info:
                return ""

            generated_data: dict[str, Any] = {}
            variables: list[str] = template_info["variables"]
            for var in variables:
                if "name" in var:
                    generated_data[var] = "John Smith"
                elif "address" in var:
                    generated_data[var] = "123 Example Street, London"
                elif "date" in var:
                    generated_data[var] = datetime.now().strftime("%d %B %Y")
                else:
                    generated_data[var] = f"[{var}]"
            sample_data = generated_data

        return await self.render_template(template_path, sample_data)


# Singleton instance
templates_service = TemplatesService()
