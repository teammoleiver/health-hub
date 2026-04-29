import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Linkedin, Newspaper, CalendarDays, Settings as SettingsIcon, ArrowUpRight, Search } from "lucide-react";

const items = [
  { to: "/social/search", title: "Search", desc: "Ask anything. AI prompt optimizer + Linkup web search (or any HTTP provider).", icon: Search },
  { to: "/social/linkedin", title: "LinkedIn Studio", desc: "Track profiles, scrape posts, cluster hot topics, generate drafts.", icon: Linkedin },
  { to: "/social/news", title: "News & RSS", desc: "Add RSS feeds, fetch articles on schedule, surface Hot News topics.", icon: Newspaper },
  { to: "/social/planner", title: "Content Planner", desc: "Unified plan for posts coming from LinkedIn signals, news, and ideas.", icon: CalendarDays },
  { to: "/social/settings", title: "Voice & Settings", desc: "About me, tone, frameworks, Apify accounts, AI provider.", icon: SettingsIcon },
];

export default function SocialOverview() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((it) => (
        <Link key={it.to} to={it.to}>
          <Card className="p-5 hover:border-primary/60 transition-colors h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <it.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold mt-3">{it.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{it.desc}</p>
          </Card>
        </Link>
      ))}
    </section>
  );
}