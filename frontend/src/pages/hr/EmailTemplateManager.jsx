// EmailTemplateManager.jsx - Email Template System for HR Dashboard
import React, { useState, useEffect } from 'react';
import { FileText, Copy, RefreshCw, Save, Trash2, Paperclip, Upload, Edit2, X, Plus } from 'lucide-react';
import { COLORS } from './HRConstants';
import jsPDF from 'jspdf';

// Default Offer Letter Templates (these will be converted to PDF and attached to email)
const DEFAULT_OFFER_TEMPLATES = [
  {
    id: 'standard_offer',
    name: 'Standard Offer Letter',
    isCustom: false,
    content: `[COMPANY_LETTERHEAD]

Date: [DATE]

Dear [INTERN_NAME],

Subject: Internship Offer Letter

We are delighted to offer you an internship position at InternHub. This letter outlines the terms and conditions of your internship.

INTERNSHIP DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━
Position: [DOMAIN] Intern
Duration: [DURATION]
Department: Technology
Start Date: [START_DATE]
Reporting To: Project Manager (PM Code: [PM_CODE])
━━━━━━━━━━━━━━━━━━━━━━━━━

TERMS & CONDITIONS:
1. This is an unpaid/paid internship program
2. Working hours: [9:00 AM - 6:00 PM, Monday to Friday]
3. You will be required to submit daily work logs and weekly reports
4. The internship may be extended based on performance and mutual agreement
5. You will be guided and mentored by experienced professionals

RESPONSIBILITIES:
• Work on assigned projects under the guidance of your Project Manager
• Submit daily work logs and weekly reports through the InternHub Portal
• Participate in team meetings and training sessions
• Maintain professional conduct and adherence to company policies
• Complete assigned tasks within stipulated timelines

WHAT WE PROVIDE:
• Hands-on experience in real-world projects
• Mentorship from industry professionals
• Certificate of completion (subject to satisfactory performance)
• Networking opportunities
• Potential for pre-placement offer based on performance

Please confirm your acceptance of this offer by signing and returning this letter within 48 hours.

We look forward to welcoming you to the InternHub family!

For any queries, please contact us at hr@internhub.com

Warm regards,

_____________________
HR Department
InternHub
EDCS - Expertise for Business Growth

---------------------------------------------------
ACCEPTANCE

I, [INTERN_NAME], hereby accept the internship offer as outlined above.

Signature: ____________________
Date: ____________________`
  },
  {
    id: 'formal_offer',
    name: 'Formal Corporate Offer Letter',
    isCustom: false,
    content: `INTERNSHIP OFFER LETTER

[COMPANY_LETTERHEAD]

Date: [DATE]
Ref No: INTERN/[INTERN_ID]/2024

[INTERN_NAME]
[INTERN_EMAIL]

Dear [INTERN_NAME],

RE: OFFER OF INTERNSHIP

Further to your application and subsequent interview, we are pleased to offer you an internship position with InternHub, a division of EDCS - Expertise for Business Growth.

POSITION DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━
Title: [DOMAIN] Intern
Department: Technology & Innovation
Duration: [DURATION]
Commencement Date: [START_DATE]
Reporting Manager: Project Manager (Code: [PM_CODE])
Work Location: [Bangalore/Remote/Hybrid]
━━━━━━━━━━━━━━━━━━━━━━━━━

SCOPE OF WORK:
As an intern, you will be expected to:
1. Assist in ongoing projects under the supervision of your assigned Project Manager
2. Participate in team meetings, brainstorming sessions, and training programs
3. Complete assigned tasks and deliverables within agreed timelines
4. Maintain daily work logs and submit weekly progress reports
5. Adhere to all company policies, procedures, and code of conduct

INTERNSHIP TERMS:
• This internship is for a fixed term as specified above
• You will be evaluated based on your performance, attendance, and deliverables
• The company reserves the right to terminate the internship with 7 days' notice
• Upon successful completion, you will receive a Certificate of Completion
• Outstanding performers may be considered for full-time employment opportunities

CONFIDENTIALITY & INTELLECTUAL PROPERTY:
All work product, innovations, and intellectual property created during the internship shall be the sole property of InternHub/EDCS. You agree to maintain strict confidentiality regarding all company information, projects, and business dealings.

ACCEPTANCE:
Please sign and return this letter by [ACCEPTANCE_DEADLINE] to confirm your acceptance of this offer. Failure to respond within the stipulated time may result in the offer being withdrawn.

We are excited to have you join our team and look forward to a mutually beneficial association.

Yours sincerely,

_____________________
[HR_MANAGER_NAME]
HR Manager
InternHub / EDCS

---------------------------------------------------
ACCEPTANCE & ACKNOWLEDGMENT

I, [INTERN_NAME], have read and understood the terms outlined in this offer letter and hereby accept the internship position.

Signature: ____________________
Date: ____________________
Place: ____________________`
  }
];

// Load custom templates from localStorage
const loadCustomTemplates = () => {
  try {
    const saved = localStorage.getItem('customOfferTemplates');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading custom templates:', error);
    return [];
  }
};

// Save custom templates to localStorage
const saveCustomTemplates = (templates) => {
  try {
    localStorage.setItem('customOfferTemplates', JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving custom templates:', error);
  }
};

// Generate Offer Letter PDF
const generateOfferLetterPDF = (template, internData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // Replace variables in template
  let content = template.content;
  const variables = {
    '[COMPANY_LETTERHEAD]': 'EDCS - Expertise for Business Growth\nInternHub Division',
    '[DATE]': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    '[INTERN_NAME]': internData.internName || '[Name]',
    '[INTERN_EMAIL]': internData.internEmail || '[Email]',
    '[INTERN_ID]': internData.internId || '[ID]',
    '[DOMAIN]': internData.domain || '[Domain]',
    '[DURATION]': internData.duration || '3 months',
    '[START_DATE]': internData.startDate || '[To be announced]',
    '[PM_CODE]': internData.pmCode || '[PM Code]',
    '[ACCEPTANCE_DEADLINE]': new Date(Date.now() + 48*60*60*1000).toLocaleDateString(),
    '[HR_MANAGER_NAME]': internData.hrName || 'HR Manager'
  };

  Object.keys(variables).forEach(key => {
    content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), variables[key]);
  });

  // Add letterhead
  pdf.setFillColor(15, 118, 110);
  pdf.rect(0, 0, pageWidth, 25, 'F');
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('EDCS - Expertise for Business Growth', pageWidth / 2, 12, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text('InternHub Division', pageWidth / 2, 19, { align: 'center' });
  yPos = 35;

  // Add content
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const lines = content.split('\n');
  lines.forEach(line => {
    if (yPos > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }

    if (line.includes('━━━')) {
      pdf.setDrawColor(15, 118, 110);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
    } else if (line.startsWith('Subject:') || line.startsWith('RE:')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(line, margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      yPos += 7;
    } else if (line.match(/^[A-Z\s&]+:$/)) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(line, margin, yPos);
      pdf.setFont('helvetica', 'normal');
      yPos += 6;
    } else {
      const wrappedLines = pdf.splitTextToSize(line || ' ', pageWidth - 2 * margin);
      pdf.text(wrappedLines, margin, yPos);
      yPos += wrappedLines.length * 5;
    }
  });

  // Footer
  const footerY = pageHeight - 15;
  pdf.setDrawColor(15, 118, 110);
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, footerY + 5, { align: 'center' });
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 9, { align: 'center' });

  return pdf;
};

// Convert PDF to base64
const pdfToBase64 = (pdf) => {
  return new Promise((resolve) => {
    const blob = pdf.output('blob');
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

// EmailTemplateManager Component
export const EmailTemplateManager = ({ 
  internData,
  onTemplateReady 
}) => {
  const [allTemplates, setAllTemplates] = useState([...DEFAULT_OFFER_TEMPLATES, ...loadCustomTemplates()]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(allTemplates[0].id);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [generatedPDF, setGeneratedPDF] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [lastNotifiedData, setLastNotifiedData] = useState(null);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedName, setEditedName] = useState('');

  // Upload custom PDF state
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // ✅ FIXED: Only regenerate when template ID actually changes
  useEffect(() => {
    generatePDF();
  }, [selectedTemplateId]); // Removed internData from dependencies
  
  // ✅ FIXED: Separate effect to notify parent only when PDF changes
  useEffect(() => {
    if (!pdfBase64) return;
    
    // Create a stable identifier for current data
    const currentDataKey = JSON.stringify({
      templateId: selectedTemplateId,
      internName: internData?.internName,
      timestamp: Math.floor(Date.now() / 1000) // Round to seconds to prevent rapid changes
    });
    
    // Only notify if data actually changed
    if (currentDataKey !== lastNotifiedData) {
      setLastNotifiedData(currentDataKey);
      
      const template = allTemplates.find(t => t.id === selectedTemplateId);
      if (onTemplateReady && template) {
        onTemplateReady({
          templateName: template.name,
          pdfBase64: pdfBase64,
          filename: `Offer_Letter_${internData?.internName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`
        });
      }
    }
  }, [pdfBase64, selectedTemplateId, internData?.internName, lastNotifiedData]);

  const generatePDF = async () => {
    const template = allTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    // If it's a custom uploaded PDF, use it directly
    if (template.customPDF) {
      setPdfBase64(template.customPDF);
      setGeneratedPDF(null);
      return;
    }

    // Otherwise, generate PDF from content
    const pdf = generateOfferLetterPDF(template, internData || {});
    setGeneratedPDF(pdf);
    
    const base64 = await pdfToBase64(pdf);
    setPdfBase64(base64);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    setShowTemplateList(false);
  };

  const handlePreviewPDF = () => {
    if (pdfBase64) {
      // Convert base64 to blob and open
      const base64Data = pdfBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else if (generatedPDF) {
      const blob = generatedPDF.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const handleDownloadPDF = () => {
    if (pdfBase64) {
      const link = document.createElement('a');
      link.href = pdfBase64;
      link.download = `Offer_Letter_${internData?.internName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      link.click();
    } else if (generatedPDF) {
      const filename = `Offer_Letter_${internData?.internName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      generatedPDF.save(filename);
    }
  };

  // Edit template
  const handleEditTemplate = (template) => {
    if (template.customPDF) {
      alert('⚠️ Cannot edit uploaded PDF templates. You can only delete and re-upload.');
      return;
    }
    setEditingTemplate(template);
    setEditedContent(template.content);
    setEditedName(template.name);
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!editedName.trim()) {
      alert('⚠️ Template name cannot be empty');
      return;
    }

    if (!editedContent.trim()) {
      alert('⚠️ Template content cannot be empty');
      return;
    }

    const updatedTemplates = allTemplates.map(t => 
      t.id === editingTemplate.id 
        ? { ...t, name: editedName, content: editedContent }
        : t
    );

    setAllTemplates(updatedTemplates);
    
    // Save custom templates to localStorage
    const customTemplates = updatedTemplates.filter(t => t.isCustom);
    saveCustomTemplates(customTemplates);

    setIsEditMode(false);
    setEditingTemplate(null);
    
    // Regenerate PDF if this was the selected template
    if (selectedTemplateId === editingTemplate.id) {
      setTimeout(() => generatePDF(), 100);
    }

    alert('✅ Template updated successfully!');
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingTemplate(null);
    setEditedContent('');
    setEditedName('');
  };

  // Delete template
  const handleDeleteTemplate = (template) => {
    if (!template.isCustom) {
      alert('⚠️ Cannot delete default templates');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    const updatedTemplates = allTemplates.filter(t => t.id !== template.id);
    setAllTemplates(updatedTemplates);
    
    // Save to localStorage
    const customTemplates = updatedTemplates.filter(t => t.isCustom);
    saveCustomTemplates(customTemplates);

    // If deleted template was selected, select first template
    if (selectedTemplateId === template.id) {
      setSelectedTemplateId(updatedTemplates[0].id);
    }

    alert('✅ Template deleted successfully!');
  };

  // Upload custom PDF
  const handleUploadCustomPDF = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('⚠️ Please upload a PDF file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64PDF = e.target.result;
      
      const newTemplate = {
        id: `custom_pdf_${Date.now()}`,
        name: file.name.replace('.pdf', ''),
        isCustom: true,
        customPDF: base64PDF,
        content: null, // No content for uploaded PDFs
      };

      const updatedTemplates = [...allTemplates, newTemplate];
      setAllTemplates(updatedTemplates);
      
      // Save to localStorage
      const customTemplates = updatedTemplates.filter(t => t.isCustom);
      saveCustomTemplates(customTemplates);

      // Select the new template
      setSelectedTemplateId(newTemplate.id);
      setShowUploadDialog(false);

      alert('✅ Custom PDF template uploaded successfully!');
    };

    reader.readAsDataURL(file);
  };

  // Create new text template
  const handleCreateNewTemplate = () => {
    const templateName = prompt('Enter template name:');
    if (!templateName || !templateName.trim()) return;

    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: templateName,
      isCustom: true,
      content: `[COMPANY_LETTERHEAD]

Date: [DATE]

Dear [INTERN_NAME],

Subject: Internship Offer Letter

[Your custom offer letter content here]

Best regards,
HR Team`
    };

    const updatedTemplates = [...allTemplates, newTemplate];
    setAllTemplates(updatedTemplates);
    
    // Save to localStorage
    const customTemplates = updatedTemplates.filter(t => t.isCustom);
    saveCustomTemplates(customTemplates);

    // Select and edit the new template
    setSelectedTemplateId(newTemplate.id);
    handleEditTemplate(newTemplate);
  };

  const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId);

  return (
    <div style={{
      padding: 16,
      background: `${COLORS.deepOcean}15`,
      borderRadius: 12,
      border: `1px solid ${COLORS.deepOcean}`,
      marginBottom: 16
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Paperclip size={18} color={COLORS.jungleTeal} />
          <span style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: COLORS.textPrimary 
          }}>
            Offer Letter Attachment
          </span>
        </div>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCreateNewTemplate}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid ${COLORS.jungleTeal}`,
              background: `${COLORS.jungleTeal}20`,
              color: COLORS.jungleTeal,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600
            }}
          >
            <Plus size={12} /> New Template
          </button>
          
          <button
            onClick={() => setShowUploadDialog(!showUploadDialog)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid ${COLORS.emeraldGlow}`,
              background: `${COLORS.emeraldGlow}20`,
              color: COLORS.emeraldGlow,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600
            }}
          >
            <Upload size={12} /> Upload PDF
          </button>
        </div>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div style={{
          marginBottom: 12,
          padding: 12,
          background: COLORS.surfaceGlass,
          borderRadius: 10,
          border: `1px solid ${COLORS.borderGlass}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 10
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
              Upload Custom PDF Template
            </span>
            <button
              onClick={() => setShowUploadDialog(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.textMuted,
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={16} />
            </button>
          </div>
          
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUploadCustomPDF}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${COLORS.borderGlass}`,
              background: COLORS.surfaceGlass,
              color: COLORS.textPrimary,
              fontSize: 12,
              cursor: 'pointer'
            }}
          />
          
          <p style={{ 
            fontSize: 11, 
            color: COLORS.textMuted, 
            margin: '8px 0 0 0',
            lineHeight: 1.4
          }}>
            💡 Upload your own custom offer letter PDF. This will be attached directly without any modifications.
          </p>
        </div>
      )}

      {/* Edit Mode */}
      {isEditMode && editingTemplate ? (
        <div style={{
          marginBottom: 12,
          padding: 12,
          background: COLORS.surfaceGlass,
          borderRadius: 10,
          border: `2px solid ${COLORS.jungleTeal}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 12
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.jungleTeal }}>
              <Edit2 size={14} style={{ display: 'inline', marginRight: 6 }} />
              Editing Template
            </span>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontSize: 12, 
              fontWeight: 500, 
              color: COLORS.textSecondary 
            }}>
              Template Name
            </label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${COLORS.borderGlass}`,
                background: COLORS.surfaceGlass,
                color: COLORS.textPrimary,
                fontSize: 13
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontSize: 12, 
              fontWeight: 500, 
              color: COLORS.textSecondary 
            }}>
              Template Content
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: 300,
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${COLORS.borderGlass}`,
                background: COLORS.surfaceGlass,
                color: COLORS.textPrimary,
                fontSize: 11,
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
            <p style={{ 
              fontSize: 10, 
              color: COLORS.textMuted, 
              margin: '6px 0 0 0',
              lineHeight: 1.3
            }}>
              Available variables: [INTERN_NAME], [INTERN_EMAIL], [INTERN_ID], [DOMAIN], [DURATION], [START_DATE], [PM_CODE], [DATE], [HR_MANAGER_NAME]
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSaveEdit}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: COLORS.jungleTeal,
                color: 'white',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 600
              }}
            >
              <Save size={14} /> Save Changes
            </button>
            
            <button
              onClick={handleCancelEdit}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${COLORS.borderGlass}`,
                background: 'transparent',
                color: COLORS.textSecondary,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Template Selector */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontSize: 13, 
              fontWeight: 500, 
              color: COLORS.textSecondary 
            }}>
              Select Offer Letter Template
            </label>
            
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowTemplateList(!showTemplateList)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${COLORS.borderGlass}`,
                  background: COLORS.surfaceGlass,
                  color: COLORS.textPrimary,
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color={COLORS.jungleTeal} />
                  {selectedTemplate?.name || 'Select Template'}
                  {selectedTemplate?.isCustom && (
                    <span style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: `${COLORS.emeraldGlow}20`,
                      color: COLORS.emeraldGlow,
                      fontWeight: 600
                    }}>
                      Custom
                    </span>
                  )}
                </span>
                <span style={{ color: COLORS.textMuted, fontSize: 11 }}>▼</span>
              </button>

              {/* ✅ FIXED DROPDOWN - Better visibility and contrast */}
              {showTemplateList && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: '#1a1f2e', // Darker background for better contrast
                  border: `2px solid ${COLORS.jungleTeal}`,
                  borderRadius: 10,
                  padding: 8,
                  zIndex: 1000,
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                  maxHeight: 400,
                  overflowY: 'auto'
                }}>
                  {allTemplates.map(template => (
                    <div
                      key={template.id}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: template.id === selectedTemplateId 
                          ? `${COLORS.jungleTeal}40` 
                          : 'rgba(255, 255, 255, 0.03)',
                        border: template.id === selectedTemplateId 
                          ? `2px solid ${COLORS.jungleTeal}` 
                          : '2px solid transparent',
                        marginBottom: 6,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => handleTemplateSelect(template.id)}
                      onMouseEnter={(e) => {
                        if (template.id !== selectedTemplateId) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(103, 146, 137, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (template.id !== selectedTemplateId) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: 13, 
                          fontWeight: 600, 
                          color: COLORS.textPrimary,
                          marginBottom: 4
                        }}>
                          {template.name}
                        </div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                          {template.isCustom ? (
                            <span>
                              {template.customPDF ? '📄 Custom PDF' : '📝 Custom Template'}
                            </span>
                          ) : (
                            '🏢 Default Template'
                          )}
                        </div>
                      </div>
                      
                      {/* Edit/Delete buttons */}
                      <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        {!template.customPDF && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTemplateList(false);
                              handleEditTemplate(template);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: `1px solid ${COLORS.jungleTeal}`,
                              background: `${COLORS.jungleTeal}20`,
                              color: COLORS.jungleTeal,
                              fontSize: 10,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Edit2 size={10} /> Edit
                          </button>
                        )}
                        
                        {template.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: `1px solid ${COLORS.red}`,
                              background: `${COLORS.red}20`,
                              color: COLORS.red,
                              fontSize: 10,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PDF Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handlePreviewPDF}
              disabled={!generatedPDF && !pdfBase64}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${COLORS.jungleTeal}`,
                background: `${COLORS.jungleTeal}20`,
                color: COLORS.jungleTeal,
                fontSize: 12,
                cursor: (generatedPDF || pdfBase64) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 600,
                opacity: (generatedPDF || pdfBase64) ? 1 : 0.5
              }}
            >
              <FileText size={14} /> Preview PDF
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={!generatedPDF && !pdfBase64}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${COLORS.emeraldGlow}`,
                background: `${COLORS.emeraldGlow}20`,
                color: COLORS.emeraldGlow,
                fontSize: 12,
                cursor: (generatedPDF || pdfBase64) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 600,
                opacity: (generatedPDF || pdfBase64) ? 1 : 0.5
              }}
            >
              <Copy size={14} /> Download PDF
            </button>
          </div>

          {/* Info Box */}
          <div style={{
            marginTop: 12,
            padding: 10,
            background: `${COLORS.orange}15`,
            borderRadius: 8,
            border: `1px solid ${COLORS.orange}`
          }}>
            <p style={{ 
              fontSize: 11, 
              color: COLORS.textSecondary, 
              margin: 0,
              lineHeight: 1.4
            }}>
              💡 <strong>This offer letter will be automatically attached to the approval email.</strong> The intern will receive both the email with credentials and the formal offer letter PDF.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

// Export function to process template variables (for use in other components)
export const processTemplateVariables = (text, data) => {
  let processed = text;
  const variables = {
    '[INTERN_NAME]': data.internName || '[Name]',
    '[INTERN_ID]': data.internId || '[ID]',
    '[PASSWORD]': data.password || '[Password]',
    '[PM_CODE]': data.pmCode || '[PM Code]',
    '[PORTAL_LINK]': data.portalLink || window.location.origin + '/login',
    '[DOMAIN]': data.domain || '[Domain]',
    '[DURATION]': data.duration || '[Duration]',
    '[START_DATE]': data.startDate || '[Start Date]',
  };

  Object.keys(variables).forEach(key => {
    processed = processed.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), variables[key]);
  });

  return processed;
};

export default EmailTemplateManager;