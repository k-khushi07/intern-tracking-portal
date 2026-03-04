// ReviewLogsPage.jsx - HR Dashboard with All PM Features
import React, { useState } from "react";
import { FileText, Calendar, Clock, CheckCircle, XCircle, Eye, Download, ChevronDown, User, TrendingUp, Target, Layers, FileCode, Send, X, Loader, ArrowLeft } from "lucide-react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  success: "#4ade80",
  warning: "#f59e0b",
  purple: "#a78bfa",
};

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export default function ReviewLogsPage({ hrEmail = "hr@company.com", addNotification }) {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [activeCategory, setActiveCategory] = useState("weekly");
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [itemToReject, setItemToReject] = useState(null);
  const [rejectError, setRejectError] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approveRequest, setApproveRequest] = useState(null);
  const [feedback, setFeedback] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const openFeedback = ({ title, message, tone = "info" }) => {
    setFeedback({ open: true, title, message, tone });
  };

  // Mock interns data with profile info - HR sees ALL interns
  const interns = [
    { 
      id: 1, 
      name: "Blessy sharon", 
      email: "blessysharon.work@gmail.com",
      avatar: "BS",
      role: "Frontend Developer",
      department: "Engineering",
      joinDate: "2024-01-15",
      totalReports: 8,
      pendingReports: 2,
      performance: 92,
      pmName: "John Smith",
      tnaSheetUrl: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
      blueprintDocUrl: "https://docs.google.com/document/d/1quncr9_h6VrzMM6lfslOosPCqBqI-cuK_sHgSLZCpZE/edit?usp=sharing",
    },
    { 
      id: 2, 
      name: "Jane Smith", 
      email: "jane.smith@company.com",
      avatar: "JS",
      role: "Backend Developer",
      department: "Engineering",
      joinDate: "2024-02-01",
      totalReports: 6,
      pendingReports: 1,
      performance: 88,
      pmName: "John Smith",
      tnaSheetUrl: "https://docs.google.com/spreadsheets/d/abc123/edit",
      blueprintDocUrl: "https://docs.google.com/document/d/1quncr9_h6VrzMM6lfslOosPCqBqI-cuK_sHgSLZCpZE/edit?usp=sharing",
    },
    { 
      id: 3, 
      name: "Mike Johnson", 
      email: "mike.johnson@company.com",
      avatar: "MJ",
      role: "UI/UX Designer",
      department: "Design",
      joinDate: "2024-01-20",
      totalReports: 7,
      pendingReports: 3,
      performance: 85,
      pmName: "Sarah Wilson",
      tnaSheetUrl: "https://docs.google.com/spreadsheets/d/ghi789/edit",
      blueprintDocUrl: "https://docs.google.com/document/d/1quncr9_h6VrzMM6lfslOosPCqBqI-cuK_sHgSLZCpZE/edit?usp=sharing",
    },
    { 
      id: 4, 
      name: "Emily Davis", 
      email: "emily.davis@company.com",
      avatar: "ED",
      role: "Data Analyst",
      department: "Analytics",
      joinDate: "2024-03-01",
      totalReports: 5,
      pendingReports: 2,
      performance: 90,
      pmName: "Sarah Wilson",
      tnaSheetUrl: "https://docs.google.com/spreadsheets/d/def456/edit",
      blueprintDocUrl: "https://docs.google.com/document/d/1quncr9_h6VrzMM6lfslOosPCqBqI-cuK_sHgSLZCpZE/edit?usp=sharing",
    },
    { 
      id: 5, 
      name: "Alex Chen", 
      email: "alex.chen@company.com",
      avatar: "AC",
      role: "Full Stack Developer",
      department: "Engineering",
      joinDate: "2024-01-10",
      totalReports: 9,
      pendingReports: 1,
      performance: 94,
      pmName: "John Smith",
      tnaSheetUrl: "https://docs.google.com/spreadsheets/d/xyz999/edit",
      blueprintDocUrl: "https://docs.google.com/document/d/1quncr9_h6VrzMM6lfslOosPCqBqI-cuK_sHgSLZCpZE/edit?usp=sharing",
    },
  ];

  // Mock Weekly Reports
  const weeklyReports = [
    {
      id: 1,
      internId: 1,
      internName: "Blessy sharon",
      internEmail: "blessysharon.work@gmail.com",
      weekNumber: 2,
      dateRange: "Jan 13 - Jan 19, 2025",
      totalHours: 42,
      daysWorked: 5,
      summary: "Completed the chatbot UI design and integrated the backend API. Started working on the user authentication flow. Made significant progress on the React components library.",
      status: "pending",
      submittedAt: "2025-01-19T16:30:00Z",
      tasks: [
        "Designed chatbot interface with 5 different layouts",
        "Integrated REST API endpoints for messaging",
        "Created reusable React components",
        "Set up authentication flow with JWT"
      ]
    },
    {
      id: 2,
      internId: 2,
      internName: "Jane Smith",
      internEmail: "jane.smith@company.com",
      weekNumber: 2,
      dateRange: "Jan 13 - Jan 19, 2025",
      totalHours: 38,
      daysWorked: 5,
      summary: "Focused on backend development, implemented new API endpoints for user management. Optimized database queries and improved response times by 40%.",
      status: "approved",
      submittedAt: "2025-01-19T14:20:00Z",
      tasks: [
        "Created 8 new API endpoints",
        "Database query optimization",
        "Implemented caching layer",
        "Written unit tests for all endpoints"
      ]
    },
    {
      id: 3,
      internId: 3,
      internName: "Mike Johnson",
      internEmail: "mike.johnson@company.com",
      weekNumber: 2,
      dateRange: "Jan 13 - Jan 19, 2025",
      totalHours: 40,
      daysWorked: 5,
      summary: "Completed UI/UX design for the mobile app. Created wireframes and high-fidelity mockups. Conducted user testing sessions with 10 participants.",
      status: "pending",
      submittedAt: "2025-01-19T17:00:00Z",
      tasks: [
        "Mobile app wireframes (15 screens)",
        "High-fidelity mockups in Figma",
        "User testing with 10 participants",
        "Design system documentation"
      ]
    },
    {
      id: 4,
      internId: 4,
      internName: "Emily Davis",
      internEmail: "emily.davis@company.com",
      weekNumber: 2,
      dateRange: "Jan 13 - Jan 19, 2025",
      totalHours: 41,
      daysWorked: 5,
      summary: "Analyzed customer data and created comprehensive reports. Built interactive dashboards using Power BI. Identified key trends in user behavior.",
      status: "pending",
      submittedAt: "2025-01-19T15:00:00Z",
      tasks: [
        "Data cleaning and preprocessing",
        "Created 5 interactive dashboards",
        "Statistical analysis of user patterns",
        "Generated actionable insights report"
      ]
    },
    {
      id: 5,
      internId: 5,
      internName: "Alex Chen",
      internEmail: "alex.chen@company.com",
      weekNumber: 2,
      dateRange: "Jan 13 - Jan 19, 2025",
      totalHours: 45,
      daysWorked: 5,
      summary: "Developed full-stack features for the e-commerce platform. Implemented payment gateway integration and order management system. Excellent progress on both frontend and backend.",
      status: "approved",
      submittedAt: "2025-01-19T18:00:00Z",
      tasks: [
        "Payment gateway integration (Stripe)",
        "Order management system",
        "Admin dashboard features",
        "API documentation updates"
      ]
    }
  ];

  // Mock Monthly Reports
  const monthlyReports = [
    {
      id: 1,
      internId: 1,
      internName: "Blessy sharon",
      internEmail: "blessysharon.work@gmail.com",
      month: "December 2024",
      totalHours: 168,
      totalDays: 22,
      avgHoursPerDay: "7.6",
      summary: "Excellent month with consistent performance. Completed major milestones including the entire frontend architecture, component library, and responsive design implementation.",
      status: "approved",
      submittedAt: "2025-01-02T10:00:00Z",
      achievements: [
        "Built complete React component library (50+ components)",
        "Implemented responsive design for all pages",
        "Achieved 95% code coverage in tests",
        "Mentored 2 junior interns"
      ],
      challenges: [
        "Complex state management in nested components",
        "Performance optimization for large data sets"
      ]
    },
    {
      id: 2,
      internId: 2,
      internName: "Jane Smith",
      internEmail: "jane.smith@company.com",
      month: "December 2024",
      totalHours: 160,
      totalDays: 21,
      avgHoursPerDay: "7.6",
      summary: "Strong performance throughout the month. Delivered all backend features on time.",
      status: "approved",
      submittedAt: "2025-01-02T11:30:00Z",
      achievements: [
        "Implemented 40+ API endpoints",
        "Reduced API response time by 60%",
        "Set up comprehensive logging system",
        "Created API documentation"
      ],
      challenges: [
        "Scaling database for high traffic",
        "Integrating third-party payment gateway"
      ]
    },
    {
      id: 3,
      internId: 5,
      internName: "Alex Chen",
      internEmail: "alex.chen@company.com",
      month: "December 2024",
      totalHours: 176,
      totalDays: 22,
      avgHoursPerDay: "8.0",
      summary: "Outstanding month with exceptional delivery. Completed full-stack features ahead of schedule and demonstrated strong technical leadership.",
      status: "approved",
      submittedAt: "2025-01-02T12:00:00Z",
      achievements: [
        "Delivered 3 major features end-to-end",
        "Implemented microservices architecture",
        "Reduced deployment time by 50%",
        "Led technical discussions in team meetings"
      ],
      challenges: [
        "Managing multiple services coordination",
        "Balancing frontend and backend priorities"
      ]
    }
  ];

  // Mock Projects
  const projects = [
    {
      id: 1,
      internId: 1,
      internName: "Blessy sharon",
      internEmail: "blessysharon.work@gmail.com",
      projectName: "E-commerce Dashboard Redesign",
      description: "Complete redesign of the admin dashboard with modern UI/UX, real-time analytics, and improved user workflows.",
      status: "In Progress",
      progress: 75,
      startDate: "2024-12-15",
      deadline: "2025-02-15",
      technologies: ["React", "TypeScript", "Tailwind CSS", "Chart.js"],
      deliverables: [
        { name: "Wireframes & Mockups", status: "Completed", date: "2024-12-20" },
        { name: "Component Library", status: "Completed", date: "2025-01-10" },
        { name: "Dashboard Pages", status: "In Progress", date: "2025-01-25" },
        { name: "Testing & QA", status: "Pending", date: "2025-02-10" }
      ],
      lastUpdate: "2025-01-19T15:00:00Z"
    },
    {
      id: 2,
      internId: 2,
      internName: "Jane Smith",
      internEmail: "jane.smith@company.com",
      projectName: "RESTful API Development",
      description: "Building a scalable RESTful API for the mobile application with authentication, real-time features, and comprehensive documentation.",
      status: "In Progress",
      progress: 85,
      startDate: "2024-12-01",
      deadline: "2025-01-31",
      technologies: ["Node.js", "Express", "MongoDB", "Socket.io"],
      deliverables: [
        { name: "API Architecture", status: "Completed", date: "2024-12-05" },
        { name: "Authentication System", status: "Completed", date: "2024-12-20" },
        { name: "Core Endpoints", status: "Completed", date: "2025-01-15" },
        { name: "Documentation", status: "In Progress", date: "2025-01-28" }
      ],
      lastUpdate: "2025-01-19T16:30:00Z"
    },
    {
      id: 3,
      internId: 3,
      internName: "Mike Johnson",
      internEmail: "mike.johnson@company.com",
      projectName: "Mobile App UI/UX Design",
      description: "Designing a user-friendly mobile application interface with focus on accessibility, modern aesthetics, and seamless user experience.",
      status: "In Progress",
      progress: 60,
      startDate: "2025-01-05",
      deadline: "2025-02-28",
      technologies: ["Figma", "Adobe XD", "Principle", "InVision"],
      deliverables: [
        { name: "User Research", status: "Completed", date: "2025-01-08" },
        { name: "Wireframes", status: "Completed", date: "2025-01-15" },
        { name: "High-Fidelity Mockups", status: "In Progress", date: "2025-02-05" },
        { name: "Prototype & Testing", status: "Pending", date: "2025-02-25" }
      ],
      lastUpdate: "2025-01-19T14:00:00Z"
    },
    {
      id: 4,
      internId: 4,
      internName: "Emily Davis",
      internEmail: "emily.davis@company.com",
      projectName: "Customer Analytics Platform",
      description: "Building comprehensive analytics platform to track customer behavior, engagement metrics, and generate actionable insights.",
      status: "In Progress",
      progress: 70,
      startDate: "2024-12-10",
      deadline: "2025-02-20",
      technologies: ["Python", "Pandas", "Power BI", "SQL"],
      deliverables: [
        { name: "Data Pipeline", status: "Completed", date: "2024-12-20" },
        { name: "Analytics Dashboard", status: "In Progress", date: "2025-01-30" },
        { name: "Report Automation", status: "Pending", date: "2025-02-10" },
        { name: "Documentation", status: "Pending", date: "2025-02-18" }
      ],
      lastUpdate: "2025-01-19T13:00:00Z"
    },
    {
      id: 5,
      internId: 5,
      internName: "Alex Chen",
      internEmail: "alex.chen@company.com",
      projectName: "E-commerce Platform Enhancement",
      description: "Full-stack development of new features for the e-commerce platform including payment processing, inventory management, and analytics.",
      status: "In Progress",
      progress: 80,
      startDate: "2024-11-15",
      deadline: "2025-01-30",
      technologies: ["React", "Node.js", "PostgreSQL", "Redis"],
      deliverables: [
        { name: "Payment Integration", status: "Completed", date: "2024-12-15" },
        { name: "Inventory System", status: "Completed", date: "2025-01-10" },
        { name: "Order Management", status: "In Progress", date: "2025-01-25" },
        { name: "Testing & Deployment", status: "Pending", date: "2025-01-28" }
      ],
      lastUpdate: "2025-01-19T18:00:00Z"
    }
  ];

  // Mock TNA Tracker Data
  const tnaData = [
    { week: 1, internId: 1, task: "Finalizing chatbot flow", planned: "Jan 8", action: "Research patterns, document flows", executed: "Jan 8", status: "Completed", reason: "-", deliverable: "Flow document" },
    { week: 1, internId: 1, task: "Preparing Q&A + menu", planned: "Jan 9", action: "Compile FAQ, design menu", executed: "Jan 9", status: "Completed", reason: "-", deliverable: "Q&A database" },
    { week: 1, internId: 1, task: "Designing chatbot UI", planned: "Jan 10", action: "Create wireframes", executed: "Jan 11", status: "Completed", reason: "Extra iterations needed", deliverable: "React components" },
    { week: 2, internId: 1, task: "Backend API setup", planned: "Jan 16", action: "Setup Express server", executed: "Jan 17", status: "Completed", reason: "Auth delay", deliverable: "API docs" },
    { week: 2, internId: 1, task: "Frontend-backend integration", planned: "Jan 18", action: "Connect React to APIs", executed: "-", status: "In Progress", reason: "-", deliverable: "Integrated app" },
    { week: 1, internId: 2, task: "Database schema design", planned: "Jan 8", action: "Design MongoDB collections", executed: "Jan 8", status: "Completed", reason: "-", deliverable: "Schema documentation" },
    { week: 1, internId: 2, task: "User authentication API", planned: "Jan 9", action: "Implement JWT auth", executed: "Jan 10", status: "Completed", reason: "Security review", deliverable: "Auth endpoints" },
    { week: 2, internId: 2, task: "Payment gateway integration", planned: "Jan 15", action: "Integrate Stripe API", executed: "Jan 16", status: "Completed", reason: "Testing delay", deliverable: "Payment system" },
    { week: 1, internId: 3, task: "User research interviews", planned: "Jan 7", action: "Conduct 10 interviews", executed: "Jan 8", status: "Completed", reason: "Scheduling conflicts", deliverable: "Research report" },
    { week: 1, internId: 4, task: "Data collection setup", planned: "Jan 8", action: "Configure data sources", executed: "Jan 8", status: "Completed", reason: "-", deliverable: "Data pipeline" },
    { week: 2, internId: 4, task: "Dashboard creation", planned: "Jan 16", action: "Build Power BI dashboards", executed: "Jan 17", status: "Completed", reason: "Design iterations", deliverable: "5 dashboards" },
    { week: 1, internId: 5, task: "Payment system design", planned: "Jan 8", action: "Design payment flow", executed: "Jan 8", status: "Completed", reason: "-", deliverable: "Technical spec" },
    { week: 2, internId: 5, task: "Stripe integration", planned: "Jan 15", action: "Implement payment API", executed: "Jan 16", status: "Completed", reason: "Testing required", deliverable: "Payment module" },
  ];

  // Mock Blueprint Data
  const blueprintData = [
    {
      id: 1,
      internId: 1,
      internName: "Blessy sharon",
      internEmail: "blessysharon.work@gmail.com",
      title: "Chatbot Development Blueprint",
      description: "Comprehensive blueprint for building an AI-powered customer support chatbot with natural language processing and multi-channel support.",
      createdAt: "2025-01-05T10:00:00Z",
      lastUpdated: "2025-01-19T14:30:00Z",
      status: "Active",
      sections: [
        {
          title: "Project Overview",
          content: "Building an intelligent chatbot to handle customer support queries across web, mobile, and messaging platforms. Target: 80% automation of common queries."
        },
        {
          title: "Technical Architecture",
          content: "React frontend, Node.js backend, OpenAI GPT-4 integration, MongoDB for conversation history, Redis for caching, Socket.io for real-time communication."
        },
        {
          title: "Key Features",
          content: "Natural language understanding, Context-aware responses, Multi-language support, Sentiment analysis, Human handoff system, Analytics dashboard."
        }
      ]
    },
    {
      id: 2,
      internId: 5,
      internName: "Alex Chen",
      internEmail: "alex.chen@company.com",
      title: "E-commerce Platform Blueprint",
      description: "Full-stack architecture blueprint for scalable e-commerce platform with microservices, payment processing, and real-time inventory management.",
      createdAt: "2024-11-15T09:00:00Z",
      lastUpdated: "2025-01-19T17:00:00Z",
      status: "Active",
      sections: [
        {
          title: "System Architecture",
          content: "Microservices architecture with React frontend, Node.js services, PostgreSQL for transactional data, Redis for caching, and message queues for async operations."
        },
        {
          title: "Core Modules",
          content: "User management, Product catalog, Shopping cart, Order processing, Payment gateway, Inventory tracking, Analytics and reporting."
        },
        {
          title: "Scalability Strategy",
          content: "Horizontal scaling with load balancers, Database replication, CDN for static assets, Caching layer, Microservices isolation."
        }
      ]
    }
  ];

  // Filter data based on selected intern
  const filterByIntern = (data) => {
    if (!selectedIntern) return [];
    return data.filter(item => item.internId === selectedIntern.id);
  };

  const filteredWeeklyReports = filterByIntern(weeklyReports);
  const filteredMonthlyReports = filterByIntern(monthlyReports);
  const filteredProjects = filterByIntern(projects);
  const filteredTnaData = filterByIntern(tnaData);
  const filteredBlueprintData = filterByIntern(blueprintData);

  // Categories configuration
  const categories = [
    { id: "weekly", label: "Weekly Reports", icon: FileText, color: COLORS.jungleTeal, count: filteredWeeklyReports.length },
    { id: "monthly", label: "Monthly Reports", icon: Calendar, color: COLORS.peachGlow, count: filteredMonthlyReports.length },
    { id: "projects", label: "Projects", icon: Layers, color: COLORS.purple, count: filteredProjects.length },
    { id: "tna", label: "TNA Tracker", icon: TrendingUp, color: COLORS.warning, count: filteredTnaData.length },
    { id: "blueprint", label: "Blueprint", icon: FileCode, color: COLORS.success, count: filteredBlueprintData.length }
  ];

  // Email API Functions
  const sendApprovalEmail = async (item, type) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/emails/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: item.internEmail,
          internName: item.internName,
          hrEmail: hrEmail,
          type: type,
          item: item
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (addNotification) {
          addNotification({
            title: "Approval Sent",
            message: `${item.internName}'s ${type} approved`,
            type: "success"
          });
        }
        openFeedback({
          title: "Approval email sent",
          message: `Approval email sent to ${item.internName}.`,
          tone: "success",
        });
        return true;
      } else {
        throw new Error(data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Email error:", error);
      openFeedback({
        title: "Approval failed",
        message: error.message || "Failed to send approval email.",
        tone: "error",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendRejectionEmail = async (item, type, reason) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/emails/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: item.internEmail,
          internName: item.internName,
          hrEmail: hrEmail,
          type: type,
          reason: reason,
          item: item
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (addNotification) {
          addNotification({
            title: "Rejection Sent",
            message: `${item.internName}'s ${type} rejected`,
            type: "warning"
          });
        }
        openFeedback({
          title: "Rejection email sent",
          message: `Rejection email sent to ${item.internName}.`,
          tone: "success",
        });
        return true;
      } else {
        throw new Error(data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Email error:", error);
      openFeedback({
        title: "Rejection failed",
        message: error.message || "Failed to send rejection email.",
        tone: "error",
      });
      return false;
    } finally {
      setIsLoading(false);
      setShowRejectModal(false);
      setRejectReason("");
      setRejectError("");
      setItemToReject(null);
    }
  };

  // Download Functions - Working PDF/TXT
  const downloadAsPDF = (item, type) => {
    const content = generateTextContent(item, type);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.replace(/\s+/g, '_')}_${item.internName?.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (addNotification) {
      addNotification({
        title: "Downloaded",
        message: `${type} downloaded successfully`,
        type: "success"
      });
    }
  };

  const downloadAsTXT = (item, type) => {
    const content = generateTextContent(item, type);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.replace(/\s+/g, '_')}_${item.internName?.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (addNotification) {
      addNotification({
        title: "Downloaded",
        message: `${type} downloaded successfully`,
        type: "success"
      });
    }
  };

  const generateTextContent = (item, type) => {
    let content = `=========================================\n`;
    content += `${type.toUpperCase()}\n`;
    content += `=========================================\n\n`;
    content += `Intern: ${item.internName}\n`;
    content += `Email: ${item.internEmail}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    content += `=========================================\n\n`;
    
    if (type === "Weekly Report") {
      content += `Week Number: ${item.weekNumber}\n`;
      content += `Date Range: ${item.dateRange}\n`;
      content += `Total Hours: ${item.totalHours} hours\n`;
      content += `Days Worked: ${item.daysWorked}\n`;
      content += `Status: ${item.status}\n\n`;
      content += `SUMMARY:\n${'-'.repeat(50)}\n${item.summary}\n\n`;
      
      if (item.tasks && item.tasks.length > 0) {
        content += `TASKS COMPLETED:\n${'-'.repeat(50)}\n`;
        item.tasks.forEach((task, i) => {
          content += `${i + 1}. ${task}\n`;
        });
      }
    } else if (type === "Monthly Report") {
      content += `Month: ${item.month}\n`;
      content += `Total Hours: ${item.totalHours} hours\n`;
      content += `Total Days: ${item.totalDays}\n`;
      content += `Average Hours/Day: ${item.avgHoursPerDay}\n`;
      content += `Status: ${item.status}\n\n`;
      content += `SUMMARY:\n${'-'.repeat(50)}\n${item.summary}\n\n`;
      
      if (item.achievements && item.achievements.length > 0) {
        content += `KEY ACHIEVEMENTS:\n${'-'.repeat(50)}\n`;
        item.achievements.forEach((achievement, i) => {
          content += `${i + 1}. ${achievement}\n`;
        });
        content += `\n`;
      }
      
      if (item.challenges && item.challenges.length > 0) {
        content += `CHALLENGES:\n${'-'.repeat(50)}\n`;
        item.challenges.forEach((challenge, i) => {
          content += `${i + 1}. ${challenge}\n`;
        });
      }
    } else if (type === "Project") {
      content += `Project Name: ${item.projectName}\n`;
      content += `Status: ${item.status}\n`;
      content += `Progress: ${item.progress}%\n`;
      content += `Start Date: ${new Date(item.startDate).toLocaleDateString()}\n`;
      content += `Deadline: ${new Date(item.deadline).toLocaleDateString()}\n\n`;
      content += `DESCRIPTION:\n${'-'.repeat(50)}\n${item.description}\n\n`;
      
      if (item.technologies && item.technologies.length > 0) {
        content += `TECHNOLOGIES:\n${'-'.repeat(50)}\n`;
        content += item.technologies.join(', ') + '\n\n';
      }
      
      if (item.deliverables && item.deliverables.length > 0) {
        content += `DELIVERABLES:\n${'-'.repeat(50)}\n`;
        item.deliverables.forEach((deliverable, i) => {
          content += `${i + 1}. ${deliverable.name}\n`;
          content += `   Status: ${deliverable.status}\n`;
          content += `   Date: ${deliverable.date}\n\n`;
        });
      }
    } else if (type === "Blueprint") {
      content += `Title: ${item.title}\n`;
      content += `Status: ${item.status}\n`;
      content += `Created: ${new Date(item.createdAt).toLocaleDateString()}\n`;
      content += `Last Updated: ${new Date(item.lastUpdated).toLocaleDateString()}\n\n`;
      content += `DESCRIPTION:\n${'-'.repeat(50)}\n${item.description}\n\n`;
      
      if (item.sections && item.sections.length > 0) {
        content += `SECTIONS:\n${'='.repeat(50)}\n\n`;
        item.sections.forEach((section, i) => {
          content += `${i + 1}. ${section.title}\n`;
          content += `${'-'.repeat(50)}\n`;
          content += `${section.content}\n\n`;
        });
      }
    }
    
    content += `\n${'='.repeat(50)}\n`;
    content += `End of Report\n`;
    content += `${'='.repeat(50)}\n`;
    
    return content;
  };

  const handleApprove = async (item, type) => {
    setApproveRequest({ item, type });
    setShowApproveConfirm(true);
  };

  const confirmApprove = async () => {
    if (!approveRequest?.item || !approveRequest?.type) {
      setShowApproveConfirm(false);
      return;
    }
    setShowApproveConfirm(false);
    await sendApprovalEmail(approveRequest.item, approveRequest.type);
    setApproveRequest(null);
  };

  const handleReject = (item, type) => {
    setRejectError("");
    setItemToReject({ item, type });
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a reason.");
      return;
    }
    await sendRejectionEmail(itemToReject.item, itemToReject.type, rejectReason);
  };

  // If no intern is selected, show profile selection
  if (!selectedIntern) {
    return <InternProfileSelection interns={interns} onSelectIntern={setSelectedIntern} />;
  }

  // Otherwise show the reports dashboard for selected intern
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px" }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: 30, borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Loader size={40} color={COLORS.jungleTeal} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: "white", fontSize: 16, fontWeight: 600 }}>Sending email...</p>
          </div>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="animate-fadeIn" style={{ marginBottom: 32 }}>
        <button
          onClick={() => setSelectedIntern(null)}
          className="hover-lift"
          style={{
            padding: "12px 20px",
            background: "rgba(103, 146, 137, 0.2)",
            border: `1px solid ${COLORS.jungleTeal}`,
            borderRadius: "12px",
            color: COLORS.peachGlow,
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
            transition: "all 0.3s ease",
          }}
        >
          <ArrowLeft size={18} />
          Back to Interns
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
          <div>
            <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, margin: 0, fontFamily: "Outfit" }}>
              {selectedIntern.name}'s Reports
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 14 }}>
              {selectedIntern.role} • {selectedIntern.department} • PM: {selectedIntern.pmName}
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`animate-fadeIn stagger-${idx + 1}`}
                style={{
                  padding: "14px 20px",
                  background: isActive ? `${cat.color}30` : "rgba(255,255,255,0.05)",
                  border: isActive ? `2px solid ${cat.color}` : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  color: isActive ? cat.color : "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
                <span>{cat.label}</span>
                {cat.count > 0 && (
                  <span style={{
                    padding: "2px 8px",
                    background: isActive ? cat.color : "rgba(255,255,255,0.1)",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? "white" : "rgba(255,255,255,0.6)"
                  }}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeCategory === "weekly" && <WeeklyReportsSection reports={filteredWeeklyReports} onApprove={handleApprove} onReject={handleReject} onDownloadPDF={downloadAsPDF} onDownloadTXT={downloadAsTXT} />}
        {activeCategory === "monthly" && <MonthlyReportsSection reports={filteredMonthlyReports} onApprove={handleApprove} onReject={handleReject} onDownloadPDF={downloadAsPDF} onDownloadTXT={downloadAsTXT} />}
        {activeCategory === "projects" && <ProjectsSection projects={filteredProjects} onDownloadPDF={downloadAsPDF} onDownloadTXT={downloadAsTXT} />}
        {activeCategory === "tna" && <TNATrackerSection data={filteredTnaData} internTnaUrl={selectedIntern.tnaSheetUrl} />}
        {activeCategory === "blueprint" && <BlueprintSection blueprints={filteredBlueprintData} internBlueprintUrl={selectedIntern.blueprintDocUrl} onDownloadPDF={downloadAsPDF} />}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectError(""); setItemToReject(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="glass animate-scaleIn" style={{ width: "100%", maxWidth: 500, borderRadius: 24, background: "rgba(7, 30, 34, 0.95)", border: "1px solid rgba(103, 146, 137, 0.3)" }}>
            <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ color: "white", margin: 0, fontSize: 20, fontWeight: 700 }}>Reject Submission</h2>
              <button onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectError(""); setItemToReject(null); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 20, fontSize: 14 }}>Provide rejection reason:</p>
              <textarea value={rejectReason} onChange={(e) => { setRejectReason(e.target.value); if (rejectError) setRejectError(""); }} placeholder="Enter reason..." rows={5} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(103, 146, 137, 0.25)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              {rejectError ? (
                <div style={{ marginTop: 10, color: "#f87171", fontSize: 13 }}>{rejectError}</div>
              ) : null}
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectError(""); setItemToReject(null); }} style={{ flex: 1, padding: "14px 20px", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
                <button onClick={handleRejectSubmit} style={{ flex: 1, padding: "14px 20px", background: `linear-gradient(135deg, ${COLORS.racingRed}, #b00320)`, color: "white", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Send size={16} />Send Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApproveConfirm && approveRequest && (
        <div
          onClick={() => setShowApproveConfirm(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2100, padding: 20 }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="glass animate-scaleIn"
            style={{ width: "100%", maxWidth: 460, borderRadius: 20, background: "rgba(7, 30, 34, 0.95)", border: "1px solid rgba(103, 146, 137, 0.3)", padding: 24 }}
          >
            <h3 style={{ margin: 0, color: "white", fontSize: 20, fontWeight: 700 }}>Confirm Approval</h3>
            <p style={{ color: "rgba(255,255,255,0.75)", marginTop: 10, marginBottom: 18 }}>
              Approve this {approveRequest.type} for <strong>{approveRequest.item?.internName}</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowApproveConfirm(false)} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={confirmApprove} style={{ padding: "10px 14px", background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`, color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback.open && (
        <div
          onClick={() => setFeedback((prev) => ({ ...prev, open: false }))}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2200, padding: 20 }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="glass animate-scaleIn"
            style={{ width: "100%", maxWidth: 480, borderRadius: 20, background: "rgba(7, 30, 34, 0.95)", border: "1px solid rgba(103, 146, 137, 0.3)", padding: 24 }}
          >
            <h3 style={{ margin: 0, color: "white", fontSize: 20, fontWeight: 700 }}>{feedback.title || "Update"}</h3>
            <p style={{ color: "rgba(255,255,255,0.75)", marginTop: 10, marginBottom: 18, whiteSpace: "pre-line" }}>
              {feedback.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setFeedback((prev) => ({ ...prev, open: false }))}
                style={{
                  padding: "10px 14px",
                  background: feedback.tone === "success" ? "rgba(16,185,129,0.9)" : feedback.tone === "error" ? "rgba(239,68,68,0.9)" : "rgba(20,184,166,0.9)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== INTERN PROFILE SELECTION ====================
function InternProfileSelection({ interns, onSelectIntern }) {
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ color: "white", fontSize: 48, fontWeight: 700, margin: 0, fontFamily: "Outfit", letterSpacing: "-0.5px" }}>
          Select an Intern Profile
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 16, fontSize: 16 }}>
          Choose an intern to review their reports and performance
        </p>
      </div>

      <div style={{
        display: "flex",
        gap: 40,
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 1200,
      }}>
        {interns.map((intern, idx) => (
          <div
            key={intern.id}
            onClick={() => onSelectIntern(intern)}
            className={`animate-fadeIn stagger-${idx + 1}`}
            style={{
              cursor: "pointer",
              transition: "all 0.3s ease",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              const avatar = e.currentTarget.querySelector('.profile-avatar');
              const name = e.currentTarget.querySelector('.profile-name');
              if (avatar) avatar.style.transform = "scale(1.1)";
              if (avatar) avatar.style.borderColor = COLORS.peachGlow;
              if (name) name.style.color = "white";
            }}
            onMouseLeave={(e) => {
              const avatar = e.currentTarget.querySelector('.profile-avatar');
              const name = e.currentTarget.querySelector('.profile-name');
              if (avatar) avatar.style.transform = "scale(1)";
              if (avatar) avatar.style.borderColor = "rgba(255, 255, 255, 0.3)";
              if (name) name.style.color = "rgba(255, 255, 255, 0.6)";
            }}
          >
            {/* Avatar */}
            <div 
              className="profile-avatar"
              style={{
                width: 160,
                height: 160,
                background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                fontWeight: 700,
                color: COLORS.peachGlow,
                border: "3px solid rgba(255, 255, 255, 0.3)",
                marginBottom: 16,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {intern.avatar}
              
              {/* Pending indicator */}
              {intern.pendingReports > 0 && (
                <div style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 32,
                  height: 32,
                  background: COLORS.racingRed,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "white",
                  border: "2px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                }}>
                  {intern.pendingReports}
                </div>
              )}
            </div>
            
            {/* Name */}
            <div 
              className="profile-name"
              style={{ 
                color: "rgba(255, 255, 255, 0.6)", 
                fontSize: 18, 
                fontWeight: 500,
                transition: "color 0.3s ease",
              }}
            >
              {intern.name}
            </div>
            
            {/* Role */}
            <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 14, marginTop: 4 }}>
              {intern.role}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== WEEKLY REPORTS SECTION ====================
function WeeklyReportsSection({ reports, onApprove, onReject, onDownloadPDF, onDownloadTXT }) {
  if (reports.length === 0) {
    return <EmptyState icon={<FileText size={48} />} message="No weekly reports found" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {reports.map((report, idx) => (
        <div 
          key={report.id} 
          className={`glass hover-lift animate-fadeIn stagger-${(idx % 3) + 1}`} 
          style={{ 
            padding: 28, 
            borderRadius: 20,
            background: "rgba(7, 30, 34, 0.6)",
            border: "1px solid rgba(103, 146, 137, 0.2)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h3 style={{ color: "white", fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8 }}>
                Week {report.weekNumber} Report
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: 14 }}>
                📅 {report.dateRange}
              </p>
            </div>
            <StatusBadge status={report.status} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatBox label="Total Hours" value={`${report.totalHours}h`} color={COLORS.jungleTeal} icon="⏱️" />
            <StatBox label="Days Worked" value={report.daysWorked} color={COLORS.peachGlow} icon="📆" />
            <StatBox label="Avg Hours/Day" value={(report.totalHours / report.daysWorked).toFixed(1)} color={COLORS.purple} icon="📊" />
          </div>

          <div style={{ marginBottom: 20, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14, borderLeft: `4px solid ${COLORS.jungleTeal}` }}>
            <div style={{ fontSize: 13, color: COLORS.jungleTeal, marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              📝 Summary
            </div>
            <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.8, fontSize: 15, margin: 0 }}>
              {report.summary}
            </p>
          </div>

          {report.tasks && (
            <div style={{ marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14 }}>
              <div style={{ fontSize: 13, color: COLORS.success, marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ✅ Key Tasks Completed
              </div>
              <ul style={{ margin: 0, paddingLeft: 24, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 2 }}>
                {report.tasks.map((task, i) => <li key={i} style={{ marginBottom: 6 }}>{task}</li>)}
              </ul>
            </div>
          )}

          <ActionButtons 
            status={report.status} 
            onApprove={() => onApprove(report, "Weekly Report")}
            onReject={() => onReject(report, "Weekly Report")}
            onDownloadPDF={() => onDownloadPDF(report, "Weekly Report")}
            onDownloadTXT={() => onDownloadTXT(report, "Weekly Report")}
          />
        </div>
      ))}
    </div>
  );
}

// ==================== MONTHLY REPORTS SECTION ====================
function MonthlyReportsSection({ reports, onApprove, onReject, onDownloadPDF, onDownloadTXT }) {
  if (reports.length === 0) {
    return <EmptyState icon={<Calendar size={48} />} message="No monthly reports found" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {reports.map((report, idx) => (
        <div 
          key={report.id} 
          className={`glass hover-lift animate-fadeIn stagger-${(idx % 3) + 1}`} 
          style={{ 
            padding: 28, 
            borderRadius: 20,
            background: "rgba(7, 30, 34, 0.6)",
            border: "1px solid rgba(103, 146, 137, 0.2)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h3 style={{ color: "white", fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8 }}>
                Monthly Report - {report.month}
              </h3>
            </div>
            <StatusBadge status={report.status} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatBox label="Total Hours" value={`${report.totalHours}h`} color={COLORS.jungleTeal} icon="⏱️" />
            <StatBox label="Total Days" value={report.totalDays} color={COLORS.peachGlow} icon="📆" />
            <StatBox label="Avg Hours/Day" value={report.avgHoursPerDay} color={COLORS.purple} icon="📊" />
          </div>

          <div style={{ marginBottom: 20, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14, borderLeft: `4px solid ${COLORS.jungleTeal}` }}>
            <div style={{ fontSize: 13, color: COLORS.jungleTeal, marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              📝 Summary
            </div>
            <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.8, fontSize: 15, margin: 0 }}>
              {report.summary}
            </p>
          </div>

          {report.achievements && (
            <div style={{ marginBottom: 16, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14 }}>
              <div style={{ fontSize: 13, color: COLORS.success, marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🏆 Key Achievements
              </div>
              <ul style={{ margin: 0, paddingLeft: 24, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 2 }}>
                {report.achievements.map((achievement, i) => <li key={i} style={{ marginBottom: 6 }}>{achievement}</li>)}
              </ul>
            </div>
          )}

          {report.challenges && (
            <div style={{ marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14 }}>
              <div style={{ fontSize: 13, color: COLORS.warning, marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ⚠️ Challenges Overcome
              </div>
              <ul style={{ margin: 0, paddingLeft: 24, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 2 }}>
                {report.challenges.map((challenge, i) => <li key={i} style={{ marginBottom: 6 }}>{challenge}</li>)}
              </ul>
            </div>
          )}

          <ActionButtons 
            status={report.status}
            onApprove={() => onApprove(report, "Monthly Report")}
            onReject={() => onReject(report, "Monthly Report")}
            onDownloadPDF={() => onDownloadPDF(report, "Monthly Report")}
            onDownloadTXT={() => onDownloadTXT(report, "Monthly Report")}
          />
        </div>
      ))}
    </div>
  );
}

// ==================== PROJECTS SECTION ====================
function ProjectsSection({ projects, onDownloadPDF, onDownloadTXT }) {
  if (projects.length === 0) {
    return <EmptyState icon={<Layers size={48} />} message="No projects found" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {projects.map((project, idx) => (
        <div 
          key={project.id} 
          className={`glass hover-lift animate-fadeIn stagger-${(idx % 3) + 1}`} 
          style={{ 
            padding: 28, 
            borderRadius: 20,
            background: "rgba(7, 30, 34, 0.6)",
            border: "1px solid rgba(103, 146, 137, 0.2)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: "white", fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8 }}>
                {project.projectName}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>
                {project.status}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.success, lineHeight: 1 }}>{project.progress}%</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Progress</div>
            </div>
          </div>

          <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.7, fontSize: 15, marginBottom: 20, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14 }}>
            {project.description}
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10, fontWeight: 600 }}>Progress</div>
            <div style={{ height: 12, background: "rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${project.progress}%`,
                background: `linear-gradient(90deg, ${COLORS.success}, ${COLORS.jungleTeal})`,
                borderRadius: 8,
                transition: "width 1s ease"
              }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
            <InfoItem label="Start Date" value={new Date(project.startDate).toLocaleDateString()} icon="🚀" />
            <InfoItem label="Deadline" value={new Date(project.deadline).toLocaleDateString()} icon="🎯" />
            <InfoItem label="Status" value={project.status} icon="📊" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12, fontWeight: 600 }}>💻 Technologies</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {project.technologies.map((tech, i) => (
                <span key={i} style={{
                  padding: "8px 14px",
                  background: "rgba(103, 146, 137, 0.2)",
                  border: "1px solid rgba(103, 146, 137, 0.4)",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.jungleTeal
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14, fontWeight: 600 }}>📦 Deliverables</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {project.deliverables.map((deliverable, i) => (
                <div key={i} style={{
                  padding: 16,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "white", marginBottom: 4 }}>{deliverable.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      Target: {deliverable.date}
                    </div>
                  </div>
                  <span style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: deliverable.status === "Completed" ? `${COLORS.success}25` : deliverable.status === "In Progress" ? `${COLORS.warning}25` : "rgba(255,255,255,0.06)",
                    color: deliverable.status === "Completed" ? COLORS.success : deliverable.status === "In Progress" ? COLORS.warning : "rgba(255,255,255,0.5)",
                    border: `1px solid ${deliverable.status === "Completed" ? COLORS.success : deliverable.status === "In Progress" ? COLORS.warning : "rgba(255,255,255,0.1)"}50`
                  }}>
                    {deliverable.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => onDownloadPDF(project, "Project")} style={{
              padding: "12px 20px",
              background: "rgba(103, 146, 137, 0.2)",
              border: "1px solid rgba(103, 146, 137, 0.4)",
              borderRadius: 12,
              color: COLORS.jungleTeal,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.3s ease"
            }}>
              <Download size={16} />Download PDF
            </button>
            <button onClick={() => onDownloadTXT(project, "Project")} style={{
              padding: "12px 20px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.3s ease"
            }}>
              <Download size={16} />Download TXT
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== TNA TRACKER SECTION ====================
function TNATrackerSection({ data, internTnaUrl }) {
  if (data.length === 0) {
    return <EmptyState icon={<TrendingUp size={48} />} message="No TNA tracker data found" />;
  }

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.week]) acc[item.week] = [];
    acc[item.week].push(item);
    return acc;
  }, {});

  return (
    <div className="glass" style={{ 
      borderRadius: 20, 
      overflow: "hidden",
      background: "rgba(7, 30, 34, 0.6)",
      border: "1px solid rgba(103, 146, 137, 0.2)",
      backdropFilter: "blur(10px)"
    }}>
      <div style={{
        padding: 24,
        background: "rgba(103, 146, 137, 0.15)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.purple})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28
          }}>
            📊
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 19 }}>
              TNA Tracker
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>
              Task, Next Action & Analysis
            </div>
          </div>
        </div>
        <a
          href={internTnaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 22px",
            background: "#0F9D58",
            borderRadius: 12,
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(15, 157, 88, 0.3)"
          }}
        >
          ✏️ View in Google Sheets
        </a>
      </div>

      <div style={{ padding: 24, overflowX: "auto" }}>
        {Object.keys(groupedData).sort().map((week, weekIdx) => (
          <div key={week} style={{ marginBottom: weekIdx < Object.keys(groupedData).length - 1 ? 28 : 0 }}>
            <div style={{
              padding: "12px 18px",
              background: `${COLORS.deepOcean}50`,
              borderRadius: 12,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Week {week}</span>
              <span style={{
                padding: "5px 12px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.8)"
              }}>
                {groupedData[week].length} tasks
              </span>
            </div>

            <div style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              minWidth: 900
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 80px 1.2fr 80px 100px 1fr 1fr",
                background: "rgba(103, 146, 137, 0.2)",
                padding: "16px 18px",
                gap: 14,
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                <div>Task</div>
                <div>Planned</div>
                <div>Action</div>
                <div>Executed</div>
                <div>Status</div>
                <div>Reason</div>
                <div>Deliverable</div>
              </div>

              {groupedData[week].map((row, idx) => (
                <div key={idx} style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 80px 1.2fr 80px 100px 1fr 1fr",
                  padding: "16px 18px",
                  gap: 14,
                  borderBottom: idx < groupedData[week].length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  alignItems: "center",
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontWeight: 500 }}>{row.task}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)" }}>{row.planned}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{row.action}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)" }}>{row.executed}</div>
                  <div>
                    <span style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: row.status === "Completed" ? `${COLORS.success}25` : row.status === "In Progress" ? `${COLORS.warning}25` : "rgba(103, 146, 137, 0.2)",
                      color: row.status === "Completed" ? COLORS.success : row.status === "In Progress" ? COLORS.warning : COLORS.jungleTeal,
                      border: `1px solid ${row.status === "Completed" ? COLORS.success : row.status === "In Progress" ? COLORS.warning : COLORS.jungleTeal}40`
                    }}>
                      {row.status}
                    </span>
                  </div>
                  <div style={{
                    color: row.reason !== "-" ? COLORS.peachGlow : "rgba(255,255,255,0.3)",
                    fontSize: 12
                  }}>
                    {row.reason}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{row.deliverable}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== BLUEPRINT SECTION ====================
function BlueprintSection({ blueprints, internBlueprintUrl, onDownloadPDF }) {
  const [expandedId, setExpandedId] = useState(null);

  if (blueprints.length === 0) {
    return <EmptyState icon={<FileCode size={48} />} message="No blueprints found" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {blueprints.map((blueprint, idx) => {
        const isExpanded = expandedId === blueprint.id;
        return (
          <div 
            key={blueprint.id} 
            className={`glass hover-lift animate-fadeIn stagger-${(idx % 3) + 1}`} 
            style={{ 
              padding: 28, 
              borderRadius: 20,
              background: "rgba(7, 30, 34, 0.6)",
              border: "1px solid rgba(103, 146, 137, 0.2)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "white", fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8 }}>
                  {blueprint.title}
                </h3>
              </div>
              <span style={{
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                background: `${COLORS.success}25`,
                color: COLORS.success,
                border: `1px solid ${COLORS.success}50`
              }}>
                {blueprint.status}
              </span>
            </div>

            <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.7, fontSize: 15, marginBottom: 20, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14 }}>
              {blueprint.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
              <InfoItem label="Created" value={new Date(blueprint.createdAt).toLocaleDateString()} icon="📅" />
              <InfoItem label="Last Updated" value={new Date(blueprint.lastUpdated).toLocaleDateString()} icon="🔄" />
              <InfoItem label="Sections" value={blueprint.sections.length} icon="📑" />
            </div>

            {isExpanded && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {blueprint.sections.map((section, i) => (
                    <div key={i} style={{
                      padding: 20,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 14,
                      borderLeft: `4px solid ${COLORS.success}`,
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 10 }}>
                        {section.title}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontSize: 14, margin: 0 }}>
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : blueprint.id)}
                style={{
                  padding: "12px 20px",
                  background: isExpanded ? `${COLORS.success}30` : "rgba(255,255,255,0.08)",
                  border: `1px solid ${isExpanded ? COLORS.success : "rgba(255,255,255,0.15)"}50`,
                  borderRadius: 12,
                  color: isExpanded ? COLORS.success : "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.3s ease"
                }}
              >
                <Eye size={16} />
                {isExpanded ? "Hide Details" : "View Full Blueprint"}
              </button>
              <a
                href={internBlueprintUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  background: "#4285F4",
                  borderRadius: 12,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(66, 133, 244, 0.3)"
                }}
              >
                ✏️ View in Google Docs
              </a>
              <button onClick={() => onDownloadPDF(blueprint, "Blueprint")} style={{
                padding: "12px 20px",
                background: "rgba(103, 146, 137, 0.2)",
                border: "1px solid rgba(103, 146, 137, 0.4)",
                borderRadius: 12,
                color: COLORS.jungleTeal,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.3s ease"
              }}>
                <Download size={16} />Download PDF
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================
function EmptyState({ icon, message }) {
  return (
    <div className="glass" style={{ 
      padding: 80, 
      borderRadius: 20, 
      textAlign: "center",
      background: "rgba(7, 30, 34, 0.6)",
      border: "1px solid rgba(103, 146, 137, 0.2)",
    }}>
      <div style={{ marginBottom: 20, opacity: 0.4, display: "flex", justifyContent: "center" }}>{icon}</div>
      <h3 style={{ color: "white", fontSize: 22, marginBottom: 10, fontWeight: 600 }}>{message}</h3>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15 }}>
        Check back later for updates
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { color: COLORS.warning, label: "Pending Review" },
    approved: { color: COLORS.success, label: "Approved" },
    rejected: { color: COLORS.racingRed, label: "Rejected" }
  };
  const { color, label } = config[status] || config.pending;

  return (
    <span style={{
      padding: "8px 16px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      background: `${color}25`,
      color: color,
      border: `1px solid ${color}50`,
      textTransform: "capitalize"
    }}>
      {label}
    </span>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <div style={{ 
      padding: 18, 
      background: "rgba(255,255,255,0.04)", 
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.05)",
      transition: "all 0.3s ease"
    }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div style={{ 
      padding: 16, 
      background: "rgba(255,255,255,0.04)", 
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.05)"
    }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "white" }}>{value}</div>
    </div>
  );
}

function ActionButtons({ status, onApprove, onReject, onDownloadPDF, onDownloadTXT }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {status === "pending" && (
        <>
          <button onClick={onApprove} style={{
            padding: "12px 20px",
            background: `${COLORS.success}25`,
            border: `1px solid ${COLORS.success}50`,
            borderRadius: 12,
            color: COLORS.success,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.3s ease"
          }}>
            <CheckCircle size={16} />Approve
          </button>
          <button onClick={onReject} style={{
            padding: "12px 20px",
            background: `${COLORS.racingRed}25`,
            border: `1px solid ${COLORS.racingRed}50`,
            borderRadius: 12,
            color: COLORS.racingRed,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.3s ease"
          }}>
            <XCircle size={16} />Reject
          </button>
        </>
      )}
      <button onClick={onDownloadPDF} style={{
        padding: "12px 20px",
        background: "rgba(103, 146, 137, 0.2)",
        border: "1px solid rgba(103, 146, 137, 0.4)",
        borderRadius: 12,
        color: COLORS.jungleTeal,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.3s ease"
      }}>
        <Download size={16} />PDF
      </button>
      <button onClick={onDownloadTXT} style={{
        padding: "12px 20px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        color: "white",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.3s ease"
      }}>
        <Download size={16} />TXT
      </button>
    </div>
  );
}
