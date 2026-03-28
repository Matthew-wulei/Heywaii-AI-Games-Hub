import { Bell, Info, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPublishedAnnouncements } from "@/lib/queries/content";

const typeStyles: Record<
  string,
  { icon: typeof Info; color: string; bg: string; border: string }
> = {
  update: {
    icon: CheckCircle2,
    color: "text-status-success",
    bg: "bg-status-success/10",
    border: "border-status-success/20",
  },
  maintenance: {
    icon: AlertTriangle,
    color: "text-status-warning",
    bg: "bg-status-warning/10",
    border: "border-status-warning/20",
  },
  info: {
    icon: Info,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
};

export default async function AnnouncementsPage() {
  const list = await getPublishedAnnouncements(40);

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
        {list.map((announcement) => {
          const style = typeStyles[announcement.type] ?? typeStyles.info;
          const Icon = style.icon;
          const dateStr = announcement.publishedAt
            ? announcement.publishedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "";
          const excerpt = announcement.body.replace(/\s+/g, " ").slice(0, 220);

          return (
            <div
              key={announcement.id}
              className="group bg-background-paper rounded-2xl border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 shadow-lg relative"
            >
              <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.bg)} />

              <Link href={`/announcements/${announcement.id}`} className="block p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="hidden sm:flex flex-col items-center flex-shrink-0">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border",
                        style.bg,
                        style.border
                      )}
                    >
                      <Icon className={cn("w-6 h-6", style.color)} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={cn(
                          "sm:hidden w-8 h-8 rounded-full flex items-center justify-center border",
                          style.bg,
                          style.border
                        )}
                      >
                        <Icon className={cn("w-4 h-4", style.color)} />
                      </span>
                      <span className="text-sm font-medium text-text-muted">{dateStr}</span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          style.bg,
                          style.color,
                          style.border
                        )}
                      >
                        {announcement.type}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                      {announcement.title}
                    </h2>

                    <p className="text-text-secondary text-sm leading-relaxed mb-4">{excerpt}…</p>

                    <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      Read More <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="text-text-muted text-center py-16">No announcements yet.</p>
      )}
    </div>
  );
}
