// InternApplicationForm.jsx - FIXED: Months duration + proper validation
import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';

const InternApplicationForm = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Education Details
    collegeName: '',
    degree: '',
    branch: '',
    yearOfStudy: '',
    cgpa: '',
    graduationYear: '',
    
    // Internship Preferences
    internshipDomain: '',
    preferredDuration: '',
    availableFrom: '',
    
    // Skills & Experience
    technicalSkills: '',
    programmingLanguages: '',
    projects: '',
    previousInternships: '',
    
    // Additional Info
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    whyEDCS: '',
    resumeLink: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (currentStep) => {
    setError('');
    
    switch(currentStep) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.gender || !formData.address || !formData.city || !formData.state || !formData.pincode) {
          setError('Please fill all required fields');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Invalid email format');
          return false;
        }
        if (!/^[6-9]\d{9}$/.test(formData.phone)) {
          setError('Invalid phone number (must be 10 digits starting with 6-9)');
          return false;
        }
        if (!/^\d{6}$/.test(formData.pincode)) {
          setError('Invalid pincode (must be 6 digits)');
          return false;
        }
        return true;
        
      case 2:
        if (!formData.collegeName || !formData.degree || !formData.branch || !formData.yearOfStudy || !formData.cgpa || !formData.graduationYear) {
          setError('Please fill all required fields');
          return false;
        }
        if (parseFloat(formData.cgpa) < 0 || parseFloat(formData.cgpa) > 10) {
          setError('CGPA should be between 0 and 10');
          return false;
        }
        const gradYear = parseInt(formData.graduationYear);
        if (gradYear < 1980 || gradYear > 2035) {
          setError('Graduation year must be between 1980 and 2035');
          return false;
        }
        return true;
        
      case 3:
        if (!formData.internshipDomain || !formData.preferredDuration || !formData.availableFrom) {
          setError('Please fill all required fields');
          return false;
        }
        return true;
        
      case 4:
        if (!formData.technicalSkills || !formData.programmingLanguages || !formData.projects || !formData.previousInternships || !formData.linkedinUrl || !formData.whyEDCS) {
          setError('Please fill all required fields (GitHub and Portfolio are optional)');
          return false;
        }
        if (!formData.resumeLink) {
          setError('Please provide your resume link');
          return false;
        }
        try {
          new URL(formData.resumeLink);
        } catch {
          setError('Please provide a valid resume link (Google Drive, Dropbox, OneDrive, etc.)');
          return false;
        }
        if (formData.linkedinUrl) {
          try {
            new URL(formData.linkedinUrl);
          } catch {
            setError('Please provide a valid LinkedIn URL');
            return false;
          }
        }
        if (formData.githubUrl) {
          try {
            new URL(formData.githubUrl);
          } catch {
            setError('Please provide a valid GitHub URL');
            return false;
          }
        }
        if (formData.portfolioUrl) {
          try {
            new URL(formData.portfolioUrl);
          } catch {
            setError('Please provide a valid Portfolio URL');
            return false;
          }
        }
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateApplicationPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPos = 15;

    const colors = {
      gradientStart: [7, 30, 34],
      gradientEnd: [29, 120, 116],
      peach: [255, 229, 217],
      darkText: [7, 30, 34],
      teal: [103, 146, 137],
      red: [217, 4, 41],
      white: [255, 255, 255],
      inputBorder: [103, 146, 137],
      sectionBg: [255, 255, 255],
    };

    const checkNewPage = () => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(...colors.peach);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = 15;
      }
    };

    // Header
    doc.setFillColor(...colors.gradientStart);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(...colors.peach);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('EDCS InternHub Application', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.teal);
    doc.text('Join the innovation team at EDCS InternHub', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.peach);
    doc.text(`Submitted: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, 39, { align: 'center' });
    
    yPos = 50;
    
    doc.setFillColor(...colors.peach);
    doc.rect(0, 45, pageWidth, pageHeight - 45, 'F');

    // Progress Indicator
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 6, 3, 3, 'F');
    
    doc.setFillColor(...colors.red);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 6, 3, 3, 'F');
    
    yPos += 12;
    
    const stepLabels = ['Personal', 'Education', 'Preferences', 'Skills & Resume'];
    const stepWidth = (pageWidth - 2 * margin) / 4;
    
    stepLabels.forEach((label, index) => {
      const xPos = margin + (stepWidth * index) + (stepWidth / 2);
      
      doc.setFillColor(...colors.red);
      doc.circle(xPos, yPos + 5, 5, 'F');
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text((index + 1).toString(), xPos, yPos + 6.5, { align: 'center' });
      
      doc.setTextColor(...colors.darkText);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(label, xPos, yPos + 14, { align: 'center' });
    });
    
    yPos += 22;

    // Helper functions
    const addSectionTitle = (title, subtitle) => {
      checkNewPage();
      
      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 16, 2, 2, 'F');
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 16, 2, 2, 'S');
      
      doc.setTextColor(...colors.darkText);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 8, yPos + 7);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.teal);
      doc.text(subtitle, margin + 8, yPos + 13);
      
      yPos += 22;
    };

    const addInputField = (label, value, isFullWidth = true) => {
      if (!value) return;
      
      checkNewPage();
      
      const fieldWidth = isFullWidth ? (pageWidth - 2 * margin) : ((pageWidth - 2 * margin - 8) / 2);
      
      doc.setTextColor(...colors.darkText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      
      yPos += 4;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(value.toString(), fieldWidth - 6);
      const lineHeight = 4;
      const minHeight = 10;
      const fieldHeight = Math.max(minHeight, (lines.length * lineHeight) + 6);
      
      if (yPos + fieldHeight > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(...colors.peach);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = 15;
        
        doc.setTextColor(...colors.darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        yPos += 4;
      }
      
      doc.setDrawColor(...colors.inputBorder);
      doc.setLineWidth(0.4);
      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, yPos, fieldWidth, fieldHeight, 2, 2, 'FD');
      
      doc.setTextColor(...colors.darkText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      let textY = yPos + 5;
      lines.forEach((line) => {
        doc.text(line, margin + 3, textY);
        textY += lineHeight;
      });
      
      yPos += fieldHeight + 6;
    };

    const addInputFieldRow = (label1, value1, label2, value2) => {
      if (!value1 && !value2) return;
      
      checkNewPage();
      
      const fieldWidth = (pageWidth - 2 * margin - 8) / 2;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const lines1 = value1 ? doc.splitTextToSize(value1.toString(), fieldWidth - 6) : [];
      const lines2 = value2 ? doc.splitTextToSize(value2.toString(), fieldWidth - 6) : [];
      
      const lineHeight = 4;
      const minHeight = 10;
      const height1 = value1 ? Math.max(minHeight, (lines1.length * lineHeight) + 6) : minHeight;
      const height2 = value2 ? Math.max(minHeight, (lines2.length * lineHeight) + 6) : minHeight;
      const fieldHeight = Math.max(height1, height2);
      
      if (yPos + fieldHeight + 4 > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(...colors.peach);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = 15;
      }
      
      if (value1) {
        doc.setTextColor(...colors.darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(label1, margin, yPos);
        
        doc.setDrawColor(...colors.inputBorder);
        doc.setLineWidth(0.4);
        doc.setFillColor(...colors.white);
        doc.roundedRect(margin, yPos + 4, fieldWidth, fieldHeight, 2, 2, 'FD');
        
        doc.setTextColor(...colors.darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let textY = yPos + 9;
        lines1.forEach((line) => {
          doc.text(line, margin + 3, textY);
          textY += lineHeight;
        });
      }
      
      if (value2) {
        const xOffset = margin + fieldWidth + 8;
        
        doc.setTextColor(...colors.darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(label2, xOffset, yPos);
        
        doc.setDrawColor(...colors.inputBorder);
        doc.setLineWidth(0.4);
        doc.setFillColor(...colors.white);
        doc.roundedRect(xOffset, yPos + 4, fieldWidth, fieldHeight, 2, 2, 'FD');
        
        doc.setTextColor(...colors.darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let textY = yPos + 9;
        lines2.forEach((line) => {
          doc.text(line, xOffset + 3, textY);
          textY += lineHeight;
        });
      }
      
      yPos += fieldHeight + 10;
    };

    const addInputFieldTriple = (label1, value1, label2, value2, label3, value3) => {
      if (!value1 && !value2 && !value3) return;
      
      checkNewPage();
      
      const fieldWidth = (pageWidth - 2 * margin - 16) / 3;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const lines1 = value1 ? doc.splitTextToSize(value1.toString(), fieldWidth - 6) : [];
      const lines2 = value2 ? doc.splitTextToSize(value2.toString(), fieldWidth - 6) : [];
      const lines3 = value3 ? doc.splitTextToSize(value3.toString(), fieldWidth - 6) : [];
      
      const lineHeight = 4;
      const minHeight = 10;
      const height1 = value1 ? Math.max(minHeight, (lines1.length * lineHeight) + 6) : minHeight;
      const height2 = value2 ? Math.max(minHeight, (lines2.length * lineHeight) + 6) : minHeight;
      const height3 = value3 ? Math.max(minHeight, (lines3.length * lineHeight) + 6) : minHeight;
      const fieldHeight = Math.max(height1, height2, height3);
      
      if (yPos + fieldHeight + 4 > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(...colors.peach);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = 15;
      }
      
      [
        { label: label1, value: value1, lines: lines1, offset: 0 },
        { label: label2, value: value2, lines: lines2, offset: fieldWidth + 8 },
        { label: label3, value: value3, lines: lines3, offset: (fieldWidth + 8) * 2 }
      ].forEach(({ label, value, lines, offset }) => {
        if (!value) return;
        
        const xOffset = margin + offset;
        
        doc.setTextColor(...colors.darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(label, xOffset, yPos);
        
        doc.setDrawColor(...colors.inputBorder);
        doc.setLineWidth(0.4);
        doc.setFillColor(...colors.white);
        doc.roundedRect(xOffset, yPos + 4, fieldWidth, fieldHeight, 2, 2, 'FD');
        
        doc.setTextColor(...colors.darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let textY = yPos + 9;
        lines.forEach((line) => {
          doc.text(line, xOffset + 3, textY);
          textY += lineHeight;
        });
      });
      
      yPos += fieldHeight + 10;
    };

    const addLinkField = (label, url) => {
      if (!url) return;
      
      checkNewPage();
      
      const fieldHeight = 10;
      
      doc.setTextColor(...colors.darkText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      
      yPos += 4;
      
      doc.setDrawColor(...colors.inputBorder);
      doc.setLineWidth(0.4);
      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, fieldHeight, 2, 2, 'FD');
      
      doc.setTextColor(...colors.gradientEnd);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const truncated = doc.splitTextToSize(url, pageWidth - 2 * margin - 6)[0];
      doc.textWithLink(truncated, margin + 3, yPos + 6, { url: url });
      
      const linkWidth = doc.getTextWidth(truncated);
      doc.setDrawColor(...colors.gradientEnd);
      doc.setLineWidth(0.3);
      doc.line(margin + 3, yPos + 6.5, margin + 3 + linkWidth, yPos + 6.5);
      
      yPos += 16;
    };

    // Content Sections
    addSectionTitle('Personal Details', "Let's start with basic information");
    addInputField('Full Name *', formData.fullName);
    addInputFieldRow('Email *', formData.email, 'Phone *', formData.phone);
    addInputFieldRow('Date of Birth *', formData.dateOfBirth, 'Gender *', formData.gender);
    addInputField('Address *', formData.address);
    addInputFieldTriple('City *', formData.city, 'State *', formData.state, 'Pincode *', formData.pincode);
    
    yPos += 8;

    addSectionTitle('Education Details', 'Tell us about your academic background');
    addInputField('College/University Name *', formData.collegeName);
    addInputFieldRow('Degree *', formData.degree, 'Branch/Specialization *', formData.branch);
    addInputFieldTriple('Year of Study *', formData.yearOfStudy, 'CGPA/Percentage *', formData.cgpa, 'Graduation Year *', formData.graduationYear);
    
    yPos += 8;

    addSectionTitle('Internship Preferences', 'What are you looking for?');
    addInputField('Preferred Domain *', formData.internshipDomain);
    addInputFieldRow('Preferred Duration *', formData.preferredDuration, 'Available From *', formData.availableFrom);
    
    yPos += 8;

    addSectionTitle('Skills & Experience', 'Show us what you\'ve got');
    addInputField('Technical Skills *', formData.technicalSkills, true, true);
    addInputField('Programming Languages *', formData.programmingLanguages);
    addInputField('Projects *', formData.projects, true, true);
    addInputField('Previous Internships/Experience *', formData.previousInternships, true, true);
    
    yPos += 4;
    addLinkField('LinkedIn URL *', formData.linkedinUrl);
    if (formData.githubUrl) addLinkField('GitHub URL', formData.githubUrl);
    if (formData.portfolioUrl) addLinkField('Portfolio URL', formData.portfolioUrl);
    
    addInputField('Why do you want to intern at EDCS InternHub? *', formData.whyEDCS, true, true);
    
    if (formData.resumeLink) {
      checkNewPage();
      
      doc.setFillColor(255, 245, 245);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'F');
      
      doc.setDrawColor(...colors.red);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'S');
      
      doc.setTextColor(...colors.red);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUME LINK *', margin + 6, yPos + 7);
      
      doc.setTextColor(...colors.gradientEnd);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const truncatedLink = doc.splitTextToSize(formData.resumeLink, pageWidth - 2 * margin - 12)[0];
      doc.textWithLink(truncatedLink, margin + 6, yPos + 14, { url: formData.resumeLink });
      
      const linkWidth = doc.getTextWidth(truncatedLink);
      doc.setDrawColor(...colors.gradientEnd);
      doc.setLineWidth(0.4);
      doc.line(margin + 6, yPos + 14.5, margin + 6 + linkWidth, yPos + 14.5);
      
      yPos += 26;
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setFillColor(...colors.gradientStart);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(...colors.peach);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Submitted: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        })}`,
        margin,
        pageHeight - 5,
        { align: 'left' }
      );
      
      doc.text(
        `${formData.fullName} - ${formData.email}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
      
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 5,
        { align: 'right' }
      );
    }

    const pdfBase64 = doc.output('dataurlstring');
    return pdfBase64;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setLoading(true);
    setError('');

    try {
      const pdfBase64 = generateApplicationPDF();
      
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      const newIntern = {
        email: formData.email,
        fullName: formData.fullName,
        name: formData.fullName, // Add name field
        role: 'intern',
        degree: formData.degree,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        location: `${formData.city}, ${formData.state}`, // Add location field
        collegeName: formData.collegeName,
        branch: formData.branch,
        yearOfStudy: formData.yearOfStudy,
        cgpa: formData.cgpa,
        graduationYear: formData.graduationYear,
        internshipDomain: formData.internshipDomain,
        preferredDuration: formData.preferredDuration,
        availableFrom: formData.availableFrom,
        technicalSkills: formData.technicalSkills,
        programmingLanguages: formData.programmingLanguages,
        projects: formData.projects,
        previousInternships: formData.previousInternships,
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        whyEDCS: formData.whyEDCS,
        resumeLink: formData.resumeLink,
        registeredAt: new Date().toISOString(),
        applicationPDF: {
          base64: pdfBase64,
          filename: `Application_${formData.fullName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
        }
      };
      
      existingUsers.push(newIntern);
      localStorage.setItem('users', JSON.stringify(existingUsers));

      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application. Please try again.');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #071e22 0%, #1d7874 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Darker Grotesque', sans-serif"
      }}>
        <div style={{
          background: '#ffe5d9',
          borderRadius: '24px',
          padding: '60px 40px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <CheckCircle size={80} color="#1d7874" style={{ marginBottom: '24px' }} />
          <h1 style={{
            fontSize: '42px',
            color: '#071e22',
            marginBottom: '16px',
            fontWeight: '800'
          }}>Application Submitted!</h1>
          <p style={{
            fontSize: '20px',
            color: '#679289',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Thank you for applying to EDCS InternHub. We've received your application and will review it shortly.
            You'll hear from us within 5-7 business days.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#d90429',
              color: '#ffe5d9',
              border: 'none',
              padding: '16px 40px',
              fontSize: '18px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  const yearOptions = [];
  for (let year = 2035; year >= 1980; year--) {
    yearOptions.push(year);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #071e22 0%, #1d7874 100%)',
      padding: '40px 20px',
      fontFamily: "'Darker Grotesque', sans-serif"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Darker+Grotesque:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '56px',
            color: '#ffe5d9',
            marginBottom: '12px',
            fontWeight: '900',
            letterSpacing: '-1px'
          }}>EDCS InternHub Application</h1>
          <p style={{
            fontSize: '22px',
            color: '#679289',
            fontWeight: '500'
          }}>Join the innovation team at EDCS InternHub</p>
        </div>

        <div style={{
          background: 'rgba(255, 229, 217, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            {[1, 2, 3, 4].map(num => (
              <div key={num} style={{
                flex: 1,
                textAlign: 'center'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: step >= num ? '#d90429' : 'rgba(255, 229, 217, 0.2)',
                  color: step >= num ? '#ffe5d9' : '#679289',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '800',
                  transition: 'all 0.3s',
                  border: step === num ? '3px solid #ffe5d9' : 'none'
                }}>{num}</div>
                <div style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: step >= num ? '#ffe5d9' : '#679289',
                  fontWeight: '600'
                }}>
                  {num === 1 && 'Personal'}
                  {num === 2 && 'Education'}
                  {num === 3 && 'Preferences'}
                  {num === 4 && 'Skills & Resume'}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            height: '6px',
            background: 'rgba(255, 229, 217, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: '#d90429',
              width: `${(step / 4) * 100}%`,
              transition: 'width 0.3s'
            }}></div>
          </div>
        </div>

        <div style={{
          background: '#ffe5d9',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          marginBottom: '32px'
        }}>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <h2 style={{
                  fontSize: '36px',
                  color: '#071e22',
                  marginBottom: '8px',
                  fontWeight: '800'
                }}>Personal Details</h2>
                <p style={{
                  fontSize: '18px',
                  color: '#679289',
                  marginBottom: '32px'
                }}>Let's start with basic information</p>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter your full name (e.g., Raj Kumar)"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="Enter 10-digit mobile (e.g., 9876543210)"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter your complete street address"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="e.g., Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="e.g., Maharashtra"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="6-digit pincode"
                      maxLength="6"
                      pattern="\d{6}"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <h2 style={{
                  fontSize: '36px',
                  color: '#071e22',
                  marginBottom: '8px',
                  fontWeight: '800'
                }}>Education Details</h2>
                <p style={{
                  fontSize: '18px',
                  color: '#679289',
                  marginBottom: '32px'
                }}>Tell us about your academic background</p>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>College/University Name *</label>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter your college/university name"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Degree *</label>
                    <select
                      name="degree"
                      value={formData.degree}
                      onChange={handleInputChange}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select Degree</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="B.E">B.E</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="BSc">BSc</option>
                      <option value="MSc">MSc</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Branch/Specialization *</label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="e.g., Computer Science Engineering"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Year of Study *</label>
                    <select
                      name="yearOfStudy"
                      value={formData.yearOfStudy}
                      onChange={handleInputChange}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduated">Graduated</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>CGPA/Percentage *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cgpa"
                      value={formData.cgpa}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="e.g., 8.5 or 85"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Graduation Year *</label>
                    <input
                      type="text"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="Type or select year"
                      list="graduationYearList"
                      required
                    />
                    <datalist id="graduationYearList">
                      {yearOptions.map(year => (
                        <option key={year} value={year} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <h2 style={{
                  fontSize: '36px',
                  color: '#071e22',
                  marginBottom: '8px',
                  fontWeight: '800'
                }}>Internship Preferences</h2>
                <p style={{
                  fontSize: '18px',
                  color: '#679289',
                  marginBottom: '32px'
                }}>What are you looking for?</p>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Preferred Domain *</label>
                  <select
                    name="internshipDomain"
                    value={formData.internshipDomain}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  >
                    <option value="">Select a domain</option>
                    <option value="Software Development">Software Development</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="AI">Artificial Intelligence</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="DevOps">DevOps</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Content Writing">Content Writing</option>
                    <option value="Business Development">Business Development</option>
                    <option value="HR">Human Resources</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Preferred Duration (in months) *</label>
                    <select
                      name="preferredDuration"
                      value={formData.preferredDuration}
                      onChange={handleInputChange}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select duration</option>
                      <option value="1 month">1 Month (30 days)</option>
                      <option value="2 months">2 Months (60 days)</option>
                      <option value="3 months">3 Months (90 days)</option>
                      <option value="4 months">4 Months (120 days)</option>
                      <option value="5 months">5 Months (150 days)</option>
                      <option value="6 months">6 Months (180 days)</option>
                      <option value="custom">Custom Duration</option>
                    </select>
                    {formData.preferredDuration === 'custom' && (
                      <input
                        type="text"
                        name="customDuration"
                        placeholder="e.g., 45 days or 1.5 months"
                        style={{...inputStyle, marginTop: '8px'}}
                        onChange={(e) => setFormData(prev => ({...prev, preferredDuration: e.target.value}))}
                      />
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Available From *</label>
                    <input
                      type="date"
                      name="availableFrom"
                      value={formData.availableFrom}
                      onChange={handleInputChange}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <h2 style={{
                  fontSize: '36px',
                  color: '#071e22',
                  marginBottom: '8px',
                  fontWeight: '800'
                }}>Skills & Experience</h2>
                <p style={{
                  fontSize: '18px',
                  color: '#679289',
                  marginBottom: '32px'
                }}>Show us what you've got</p>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Technical Skills *</label>
                  <textarea
                    name="technicalSkills"
                    value={formData.technicalSkills}
                    onChange={handleInputChange}
                    style={{...inputStyle, minHeight: '100px', resize: 'vertical'}}
                    placeholder="List your technical skills (e.g., React, Node.js, Python, Java, SQL, AWS, Docker, Git...)"
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Programming Languages *</label>
                  <input
                    type="text"
                    name="programmingLanguages"
                    value={formData.programmingLanguages}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="e.g., JavaScript, Python, C++, Java, Go"
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Projects (Describe 1-2 key projects) *</label>
                  <textarea
                    name="projects"
                    value={formData.projects}
                    onChange={handleInputChange}
                    style={{...inputStyle, minHeight: '120px', resize: 'vertical'}}
                    placeholder="Describe your major projects: project name, technologies used, your role, and impact/results achieved..."
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Previous Internships/Experience *</label>
                  <textarea
                    name="previousInternships"
                    value={formData.previousInternships}
                    onChange={handleInputChange}
                    style={{...inputStyle, minHeight: '100px', resize: 'vertical'}}
                    placeholder="Mention any previous internships, work experience, or write 'None' if this is your first internship..."
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>LinkedIn URL *</label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="https://linkedin.com/in/yourprofile"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>GitHub URL (Optional)</label>
                    <input
                      type="url"
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Portfolio URL (Optional)</label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={labelStyle}>Why do you want to intern at EDCS InternHub? *</label>
                  <textarea
                    name="whyEDCS"
                    value={formData.whyEDCS}
                    onChange={handleInputChange}
                    style={{...inputStyle, minHeight: '120px', resize: 'vertical'}}
                    placeholder="Tell us what excites you about EDCS InternHub, how this aligns with your career goals, and what you hope to learn..."
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Resume Link (Google Drive / Dropbox / OneDrive) *</label>
                  <input
                    type="url"
                    name="resumeLink"
                    value={formData.resumeLink}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="https://drive.google.com/file/d/... (paste your shareable link here)"
                    required
                  />
                  <p style={{
                    fontSize: '14px',
                    color: '#679289',
                    marginTop: '8px',
                    lineHeight: '1.5'
                  }}>
                    <strong>How to get shareable link:</strong><br/>
                    <strong>Google Drive:</strong> Right-click file → Share → Copy link<br/>
                    <strong>Dropbox:</strong> Click Share → Create link → Copy link<br/>
                    <strong>OneDrive:</strong> Right-click → Share → Copy link<br/>
                    Make sure link is set to "Anyone with the link can view"
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(217, 4, 41, 0.1)',
                border: '2px solid #d90429',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={24} color="#d90429" />
                <p style={{
                  color: '#d90429',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0
                }}>{error}</p>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              marginTop: '32px'
            }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    background: 'transparent',
                    border: '2px solid #1d7874',
                    color: '#1d7874',
                    padding: '16px 32px',
                    fontSize: '18px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    transition: 'all 0.3s',
                    flex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#1d7874';
                    e.target.style.color = '#ffe5d9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#1d7874';
                  }}
                >
                  Previous
                </button>
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    background: '#d90429',
                    border: 'none',
                    color: '#ffe5d9',
                    padding: '16px 32px',
                    fontSize: '18px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    transition: 'transform 0.2s',
                    flex: 1,
                    marginLeft: step === 1 ? 'auto' : '0'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#679289' : '#d90429',
                    border: 'none',
                    color: '#ffe5d9',
                    padding: '16px 32px',
                    fontSize: '18px',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    transition: 'transform 0.2s',
                    flex: 1
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '16px',
  fontWeight: '700',
  color: '#071e22',
  marginBottom: '8px'
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '16px',
  border: '2px solid #679289',
  borderRadius: '12px',
  background: '#fff',
  color: '#071e22',
  fontFamily: "'Darker Grotesque', sans-serif",
  fontWeight: '500',
  transition: 'all 0.3s',
  boxSizing: 'border-box',
  outline: 'none'
};

export default InternApplicationForm;