import { supabase } from "@/integrations/supabase/client";

type EmailTemplate = "welcome" | "health-reminder" | "system-alert" | "weekly-report" | "notification";

interface SendEmailOptions {
  to?: string; // defaults to current user's email
  templateName: EmailTemplate;
  templateData?: Record<string, any>;
}

interface SendCustomEmailOptions {
  to?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendTemplateEmail(options: SendEmailOptions) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: {
      to: options.to,
      templateName: options.templateName,
      templateData: options.templateData,
    },
  });

  if (error) throw error;
  return data;
}

export async function sendCustomEmail(options: SendCustomEmailOptions) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    },
  });

  if (error) throw error;
  return data;
}

// Convenience helpers
export const sendWelcomeEmail = (name: string, to?: string) =>
  sendTemplateEmail({ templateName: "welcome", templateData: { name }, to });

export const sendHealthReminder = (title: string, message: string, to?: string) =>
  sendTemplateEmail({ templateName: "health-reminder", templateData: { title, message }, to });

export const sendSystemAlert = (title: string, message: string, to?: string) =>
  sendTemplateEmail({ templateName: "system-alert", templateData: { title, message }, to });

export const sendWeeklyReport = (sections: { title: string; value: string }[], to?: string) =>
  sendTemplateEmail({ templateName: "weekly-report", templateData: { sections }, to });
