/**
 * BMAD Workflow Templates
 * Pre-built templates for common BMAD workflows
 */

// Template 1: Authentication System
const AUTH_TEMPLATE = {
  name: 'Authentication System',
  brd: {
    summary: 'Secure user authentication with OAuth2 and session management',
    stakeholders: ['End Users', 'Security Team', 'DevOps'],
    functional: [
      'User registration with email/password',
      'OAuth2 social login (Google, GitHub)',
      'JWT-based session management',
      'Password reset flow',
      'Multi-factor authentication'
    ],
    nonFunctional: [
      'Security: OAuth2, JWT, bcrypt',
      'Performance: <100ms auth requests',
      'Scalability: 100k concurrent users'
    ],
    successCriteria: [
      '99.99% auth success rate',
      'Zero security incidents',
      'Sub-100ms response time'
    ],
    constraints: [
      'Must use OAuth2 standard',
      'GDPR compliant',
      'SOC2 Type II'
    ]
  }
};

// Template 2: E-commerce Platform
const ECOMMERCE_TEMPLATE = {
  name: 'E-commerce Platform',
  brd: {
    summary: 'Full-stack e-commerce with cart, checkout, and inventory',
    stakeholders: ['Customers', 'Merchants', 'Payment Processors'],
    functional: [
      'Product catalog with search',
      'Shopping cart management',
      'Checkout with payment integration',
      'Order management',
      'Inventory tracking'
    ],
    nonFunctional: [
      'Performance: <200ms page loads',
      'Security: PCI DSS compliant',
      'Availability: 99.9% uptime'
    ],
    successCriteria: [
      'Conversion rate > 2%',
      'Cart abandonment < 70%',
      'Payment success > 95%'
    ]
  }
};

// Template 3: Dashboard/Analytics
const DASHBOARD_TEMPLATE = {
  name: 'Analytics Dashboard',
  brd: {
    summary: 'Real-time analytics dashboard with data visualization',
    stakeholders: ['Business Users', 'Analysts', 'Executives'],
    functional: [
      'Real-time data streaming',
      'Interactive charts and graphs',
      'Custom report generation',
      'Export functionality',
      'User role management'
    ],
    nonFunctional: [
      'Performance: <500ms data loads',
      'Scalability: Handle 1M data points',
      'Accessibility: WCAG AA'
    ],
    successCriteria: [
      'User adoption > 80%',
      'Report generation < 5s',
      'Data accuracy 100%'
    ]
  }
};

// Template 4: Mobile App Backend
const MOBILE_BACKEND_TEMPLATE = {
  name: 'Mobile App Backend',
  brd: {
    summary: 'RESTful API backend for mobile applications',
    stakeholders: ['Mobile Users', 'App Developers', 'API Consumers'],
    functional: [
      'RESTful API endpoints',
      'Push notification service',
      'File upload/storage',
      'Real-time messaging',
      'User profile management'
    ],
    nonFunctional: [
      'Performance: <200ms API responses',
      'Security: API key + JWT',
      'Scalability: 10k req/sec'
    ],
    successCriteria: [
      'API uptime 99.95%',
      'Response time SLA met',
      'Zero data breaches'
    ]
  }
};

// Template 5: AI/ML Pipeline
const AI_ML_TEMPLATE = {
  name: 'AI/ML Pipeline',
  brd: {
    summary: 'End-to-end ML pipeline with model training and inference',
    stakeholders: ['Data Scientists', 'ML Engineers', 'Business Users'],
    functional: [
      'Data ingestion and preprocessing',
      'Model training pipeline',
      'Model versioning and registry',
      'Real-time inference API',
      'Model monitoring and drift detection'
    ],
    nonFunctional: [
      'Performance: <50ms inference',
      'Scalability: 1000 req/sec',
      'Accuracy: >95% model accuracy'
    ],
    successCriteria: [
      'Model accuracy maintained',
      'Inference latency met',
      'Pipeline reliability > 99%'
    ]
  }
};

// Get template by name
function getTemplate(name) {
  const templates = {
    'auth': AUTH_TEMPLATE,
    'authentication': AUTH_TEMPLATE,
    'ecommerce': ECOMMERCE_TEMPLATE,
    'e-commerce': ECOMMERCE_TEMPLATE,
    'dashboard': DASHBOARD_TEMPLATE,
    'analytics': DASHBOARD_TEMPLATE,
    'mobile': MOBILE_BACKEND_TEMPLATE,
    'mobile-backend': MOBILE_BACKEND_TEMPLATE,
    'ai-ml': AI_ML_TEMPLATE,
    'ml-pipeline': AI_ML_TEMPLATE
  };
  
  return templates[name.toLowerCase()] || null;
}

// Generate BMAD workflow from template
function generateWorkflowFromTemplate(templateName, customizations = {}) {
  const template = getTemplate(templateName);
  if (!template) {
    return null;
  }
  
  // Merge customizations
  const brd = {
    ...template.brd,
    ...customizations
  };
  
  return {
    template: template.name,
    brd: brd,
    workflow: {
      phase1: 'Business Analysis (BRD)',
      phase2: 'Technical Modeling (TSD)',
      phase3: 'Architecture & Build',
      phase4: 'Deploy & Deliver'
    }
  };
}

module.exports = {
  AUTH_TEMPLATE,
  ECOMMERCE_TEMPLATE,
  DASHBOARD_TEMPLATE,
  MOBILE_BACKEND_TEMPLATE,
  AI_ML_TEMPLATE,
  getTemplate,
  generateWorkflowFromTemplate
};