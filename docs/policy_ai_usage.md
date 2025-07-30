# AI Usage Policy - Solicitor Brain System

## 1. Purpose and Scope

This policy governs the use of AI technology in our legal practice management system, ensuring compliance with Solicitors Regulation Authority (SRA) guidance and maintaining professional standards.

## 2. Core Principles

### 2.1 Human Oversight
- All AI outputs require human review before use in legal matters
- AI serves as an administrative assistant only, not as legal counsel
- Final decisions remain with qualified solicitors

### 2.2 Transparency
- All screens display: "AI outputs are organisational assistance only – verify before use"
- Clients are informed when AI tools assist in their matters
- Clear audit trails for all AI-assisted work

## 3. Compliance Mapping to SRA Requirements

### 3.1 Competence and Legal Knowledge (SRA Principle 7)
- **Requirement**: Maintain competence and act with integrity
- **Implementation**: 
  - Mandatory citation of sources for all AI outputs
  - Hallucination detection with 0-tolerance policy
  - Regular accuracy audits (target: ≥97% fact-check precision)

### 3.2 Client Care (SRA Principle 4)
- **Requirement**: Act in the best interests of clients
- **Implementation**:
  - Per-case data isolation with AES-GCM encryption
  - No client data leaves on-premises infrastructure
  - UK-jurisdiction filtering for all legal references

### 3.3 Confidentiality (SRA Principle 6)
- **Requirement**: Keep client affairs confidential
- **Implementation**:
  - Private ChromaDB collections per case
  - Encrypted storage with case-specific keys
  - MFA authentication with YubiKey support

### 3.4 Professional Judgement
- **Requirement**: Exercise independent professional judgement
- **Implementation**:
  - Three-state sign-off system: Suggested → Accepted/Amended/Rejected
  - No automated legal advice generation
  - Human-in-the-loop for all case decisions

## 4. Prohibited Uses

The AI system SHALL NOT:
- Generate legal advice without human review
- Create court documents without solicitor approval
- Make case strategy decisions
- Communicate directly with clients or courts
- Process data outside UK jurisdiction

## 5. Quality Assurance

### 5.1 Key Performance Indicators
- Auto-file precision: ≥95%
- Email-to-case matching: ≥90%
- Fact-check precision: ≥97%
- Hallucination events: 0

### 5.2 Testing Requirements
- Daily golden-set regression tests
- Red-team hallucination injection tests
- Quarterly accuracy audits
- Monthly compliance reviews

## 6. Security Measures

- Full-disk LUKS encryption
- Per-case AES-GCM encryption
- Immutable audit logs
- ClamAV scanning for all uploads
- Air-gapped quarterly archives

## 7. Training and Awareness

All staff must:
- Complete AI ethics training before system access
- Understand verification requirements
- Report any suspected errors immediately
- Participate in quarterly review sessions

## 8. Incident Response

In case of:
- **Hallucination detection**: Immediate system quarantine, manual review
- **Data breach**: Follow existing GDPR procedures, notify ICO within 72 hours
- **System compromise**: Activate disaster recovery, restore from backups

## 9. Review and Updates

- Policy review: Quarterly
- SRA guidance monitoring: Ongoing
- System capability assessment: Monthly
- User feedback integration: Continuous

## 10. Accountability

- **System Owner**: Managing Partner
- **Technical Lead**: IT Director
- **Compliance Officer**: COLP/COFA
- **Day-to-day Management**: Practice Manager

---

*Last Updated: [Date]*
*Version: 1.0*
*Next Review: [Date + 3 months]*