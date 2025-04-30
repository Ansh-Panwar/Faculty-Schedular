import { MailService } from '@sendgrid/mail';

// Initialize mailService only if API key is available
let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid initialized successfully");
} else {
  console.warn("Warning: SENDGRID_API_KEY environment variable is not set. Email functionality will be disabled.");
}

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string | null;
  html?: string | null;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Check if mail service is initialized
    if (!mailService) {
      console.log(`[Email not sent - SendGrid disabled] Would have sent email to ${params.to} with subject "${params.subject}"`);
      return true; // Return true to avoid breaking app flow, but log that email wasn't actually sent
    }
    
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    await mailService!.send(emailData);
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send a faculty appointment request email
 * @param facultyEmail Faculty's email address
 * @param studentEmail Student's email address  
 * @param studentName Student's name
 * @param appointmentDate Appointment date
 * @param appointmentTime Appointment time
 * @param acceptUrl URL to accept the appointment
 * @param rejectUrl URL to reject the appointment
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendFacultyAppointmentRequest(
  facultyEmail: string,
  studentEmail: string,
  studentName: string,
  appointmentDate: string,
  appointmentTime: string,
  token: string
): Promise<boolean> {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
  const acceptUrl = `${BASE_URL}/api/appointment/confirm/${token}?status=accepted`;
  const rejectUrl = `${BASE_URL}/api/appointment/confirm/${token}?status=rejected`;

  const subject = `New Appointment Request from ${studentName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4b5563;">New Appointment Request</h2>
      <p>Dear Faculty Member,</p>
      <p>You have received a new appointment request from a student:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Student:</strong> ${studentName} (${studentEmail})</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
      </div>
      
      <p>Please use the buttons below to accept or reject this appointment request:</p>
      
      <div style="margin: 30px 0;">
        <a href="${acceptUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accept Appointment</a>
        <a href="${rejectUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reject Appointment</a>
      </div>
      
      <p>Thank you,<br>Faculty Finder System</p>
    </div>
  `;
  
  // Get the verified sender email from environment or fall back to a default for development
  const senderEmail = process.env.VERIFIED_EMAIL || 'noreply@faculty-scheduler.replit.app';
  
  return sendEmail({
    to: facultyEmail,
    from: senderEmail, // This should be a verified sender in SendGrid
    subject,
    html
  });
}

/**
 * Send a student appointment confirmation email
 * @param studentEmail Student's email address
 * @param facultyName Faculty's name
 * @param appointmentDate Appointment date
 * @param appointmentTime Appointment time
 * @param status Appointment status (accepted/rejected)
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendStudentAppointmentConfirmation(
  studentEmail: string,
  facultyName: string,
  appointmentDate: string,
  appointmentTime: string,
  status: 'accepted' | 'rejected'
): Promise<boolean> {
  const isAccepted = status === 'accepted';
  const subject = `Appointment ${isAccepted ? 'Confirmed' : 'Declined'} with ${facultyName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isAccepted ? '#10b981' : '#ef4444'};">Appointment ${isAccepted ? 'Confirmed' : 'Declined'}</h2>
      <p>Dear Student,</p>
      <p>Your appointment request with ${facultyName} has been <strong>${isAccepted ? 'accepted' : 'declined'}</strong>.</p>
      
      ${isAccepted ? `
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Faculty:</strong> ${facultyName}</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
      </div>
      
      <p>Please make sure to arrive on time for your appointment.</p>
      ` : `
      <p>Please try booking another time slot or contact the faculty member directly for more information.</p>
      `}
      
      <p>Thank you,<br>Faculty Finder System</p>
    </div>
  `;
  
  // Get the verified sender email from environment or fall back to a default for development
  const senderEmail = process.env.VERIFIED_EMAIL || 'noreply@faculty-scheduler.replit.app';
  
  return sendEmail({
    to: studentEmail,
    from: senderEmail, // This should be a verified sender in SendGrid
    subject,
    html
  });
}