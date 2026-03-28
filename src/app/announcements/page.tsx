import { Bell, Info, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Platform Update v1.2: New Claude 3.5 Integration",
    date: "March 25, 2026",
    type: "update",
    icon: CheckCircle2,
    color: "text-status-success",
    bg: "bg-status-success/10",
    border: "border-status-success/20",
    excerpt: "We're excited to announce that Claude 3.5 Sonnet is now available as an official model for all HeyWaii users."
  },
  {
    id: 2,
    title: "Scheduled Maintenance Notification",
    date: "March 28, 2026",
    type: "maintenance",
    icon: AlertTriangle,
    color: "text-status-warning",
    bg: "bg-status-warning/10",
    border: "border-status-warning/20",
    excerpt: "Platform services will be briefly interrupted for database optimization between 2:00 AM - 4:00 AM UTC."
  },
  {
    id: 3,
    title: "Welcome to HeyWaii Gameshub Beta!",
    date: "March 20, 2026",
    type: "info",
    icon: Info,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    excerpt: "The wait is over! Dive into the world of AI-powered interactive fiction and games. Start exploring today."
  }
];

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center md:justify-start gap-3">
          <Bell className="w-8 h-8 text-primary" />
          Announcements
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto md:mx-0">
          Stay up to date with the latest platform news, updates, and maintenance schedules.
        </p>
      </div>

      <div className="space-y-6">
        {ANNOUNCEMENTS.map((announcement) => (
          <div 
            key={announcement.id} 
            className="group bg-background-paper rounded-2xl border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 shadow-lg relative"
          >
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", announcement.bg)} />
            
            <Link href={`/announcements/${announcement.id}`} className="block p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                
                {/* Icon Column */}
                <div className="hidden sm:flex flex-col items-center flex-shrink-0">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border", announcement.bg, announcement.border)}>
                    <announcement.icon className={cn("w-6 h-6", announcement.color)} />
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("sm:hidden w-8 h-8 rounded-full flex items-center justify-center border", announcement.bg, announcement.border)}>
                      <announcement.icon className={cn("w-4 h-4", announcement.color)} />
                    </span>
                    <span className="text-sm font-medium text-text-muted">{announcement.date}</span>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", announcement.bg, announcement.color, announcement.border)}>
                      {announcement.type}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    {announcement.title}
                  </h2>
                  
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    {announcement.excerpt}
                  </p>
                  
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Read More <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>

              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}