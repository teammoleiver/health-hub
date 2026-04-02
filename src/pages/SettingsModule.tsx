import { User, Key, Globe, Bell, Download, Heart } from "lucide-react";
import { USER_PROFILE } from "@/lib/health-data";
import profilePhoto from "@/assets/profile-photo.jpg";

export default function SettingsModule() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Settings</h1>

      {/* Profile */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <img src={profilePhoto} alt={USER_PROFILE.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
          <div>
            <h3 className="font-display font-semibold text-foreground">{USER_PROFILE.name}</h3>
            <p className="text-xs text-muted-foreground">{USER_PROFILE.fullName}</p>
            <p className="text-xs text-muted-foreground">Born: 20/10/1992 · Height: {USER_PROFILE.heightCm}cm</p>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      {[
        {
          icon: Key,
          title: "OpenAI API Key",
          desc: "Required for AI Health Assistant and health record analysis",
          action: "Configure",
        },
        {
          icon: Heart,
          title: "Fasting Protocol",
          desc: "16:8 active. 5:2 disabled. Manage in Fasting module.",
          action: "Manage",
        },
        {
          icon: Globe,
          title: "Language",
          desc: "English / Spanish",
          action: "English",
        },
        {
          icon: Bell,
          title: "Notifications",
          desc: "Reminders for water, meals, fasting windows",
          action: "Configure",
        },
        {
          icon: Download,
          title: "Data Export",
          desc: "Export your health data as CSV or PDF",
          action: "Export",
        },
      ].map((item) => (
        <div key={item.title} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent transition font-medium">
            {item.action}
          </button>
        </div>
      ))}

      {/* Medical Team */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Medical Team</h3>
        <div className="space-y-2 text-sm text-foreground">
          <p>🩺 Family Doctor: <strong>{USER_PROFILE.familyDoctor}</strong></p>
          <p>🏥 Occupational: <strong>{USER_PROFILE.occupationalDoctor}</strong></p>
          <p>🥗 Nutritionist: <strong>{USER_PROFILE.nutritionist}</strong></p>
          <p>🏋️ Gym: <strong>{USER_PROFILE.gymSystem}</strong></p>
          <p>🏢 Employer: <strong>{USER_PROFILE.employer}</strong></p>
        </div>
      </div>

      {/* Known Conditions */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Known Conditions</h3>
        <div className="space-y-2">
          {USER_PROFILE.conditions.map((c) => (
            <div key={c} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-warning mt-0.5">•</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Future Integrations */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Connected Apps</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>📱 Google Fit — <em>Coming soon</em></p>
          <p>⌚ Apple Health — <em>Coming soon</em></p>
          <p>💬 WhatsApp Reminders — <em>Coming soon</em></p>
        </div>
      </div>
    </div>
  );
}
