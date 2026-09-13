import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CalendarDays, ChevronRight, CircleHelp, ClipboardList, FileText, HeartPulse, Home, MessageCircle, Pill, Search, Sparkles, Stethoscope, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DHANVATARI Patient Portal" },
      { name: "description", content: "A calm, connected healthcare experience for appointments, lab results, medications, and care guidance." },
      { property: "og:title", content: "DHANVATARI Patient Portal" },
      { property: "og:description", content: "One connected healthcare experience — from care to clarity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DhanvatariDashboard,
});

type Profile = { display_name: string; initials: string; care_team_name: string; care_team_specialty: string };
type Appointment = { appointment_date: string; start_time: string; end_time: string; appointment_type: string; specialty: string; clinician_name: string; notes: string[] };
type Metric = { label: string; value: string; unit: string | null; trend: string; status: string };
type Lab = { test_name: string; result_value: string; result_unit: string; status: string };
type Medication = { medication_name: string; dosage: string; schedule: string; note: string };
type Activity = { event_title: string; event_date: string; detail: string; accent: string };

const demoId = "11111111-1111-4111-8111-111111111111";

function DhanvatariDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      const [profileResult, appointmentResult, metricsResult, labResult, medicationResult, activityResult] = await Promise.all([
        supabase.from("patient_profiles").select("display_name, initials, care_team_name, care_team_specialty").eq("id", demoId).single(),
        supabase.from("appointments").select("appointment_date, start_time, end_time, appointment_type, specialty, clinician_name, notes").eq("patient_profile_id", demoId).order("appointment_date").limit(1).single(),
        supabase.from("health_metrics").select("label, value, unit, trend, status").eq("patient_profile_id", demoId).order("sort_order"),
        supabase.from("lab_results").select("test_name, result_value, result_unit, status").eq("patient_profile_id", demoId),
        supabase.from("medications").select("medication_name, dosage, schedule, note").eq("patient_profile_id", demoId),
        supabase.from("activity_events").select("event_title, event_date, detail, accent").eq("patient_profile_id", demoId).order("sort_order"),
      ]);
      if (!mounted) return;
      if (profileResult.error || appointmentResult.error || metricsResult.error || labResult.error || medicationResult.error || activityResult.error) {
        toast.error("We couldn't load your care workspace. Please try again.");
      }
      setProfile(profileResult.data);
      setAppointment(appointmentResult.data);
      setMetrics(metricsResult.data ?? []);
      setLabs(labResult.data ?? []);
      setMedications(medicationResult.data ?? []);
      setActivities(activityResult.data ?? []);
      setLoading(false);
    };
    void loadDashboard();
    return () => { mounted = false; };
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;
    return [...labs.map((item) => item.test_name), ...medications.map((item) => item.medication_name)].filter((item) => item.toLowerCase().includes(query));
  }, [labs, medications, search]);

  const navItems = [
    { label: "Overview", icon: Home },
    { label: "Appointments", icon: CalendarDays },
    { label: "Health snapshot", icon: HeartPulse },
    { label: "Lab results", icon: ClipboardList },
    { label: "Medications", icon: Pill },
    { label: "Messages", icon: MessageCircle },
  ];

  const selectNav = (label: string) => {
    setActiveNav(label);
    if (label !== "Overview") toast(`${label} is ready for your next care step.`);
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-foreground antialiased">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line-soft bg-surface px-4 py-5 lg:flex">
          <div className="flex items-center gap-2.5 px-1.5">
            <div className="grid size-9 place-items-center rounded-[10px] bg-teal font-display text-lg leading-none text-primary-foreground">d</div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold tracking-[0.14em]">DHANVATARI</p>
              <p className="text-[9px] text-ink-soft">Patient portal</p>
            </div>
          </div>
          <p className="mt-1 px-1.5 font-display text-[10px] italic leading-snug text-ink-soft">from care to clarity.</p>
          <nav className="mt-7 flex flex-col gap-0.5 text-[13px] font-medium">
            {navItems.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => selectNav(label)} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${activeNav === label ? "bg-teal-soft text-teal" : "text-ink-soft hover:bg-paper hover:text-foreground"}`}>
                <Icon className="size-4" strokeWidth={1.8} />{label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-lg border border-line-soft bg-paper/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Care team</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-full bg-cobalt-soft text-[11px] font-semibold text-cobalt">MA</div>
              <div className="leading-tight"><p className="text-[12px] font-semibold">{profile?.care_team_name ?? "Dr. Maya Alvarez"}</p><p className="text-[10px] text-ink-soft">{profile?.care_team_specialty ?? "Primary care"}</p></div>
            </div>
            <button type="button" onClick={() => toast("Your care team will be available here soon.")} className="mt-2.5 text-[11px] font-semibold text-teal">Message <ChevronRight className="inline size-3" /></button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-line-soft bg-surface/90 backdrop-blur">
            <div className="flex items-center gap-4 px-5 py-3.5 lg:px-8">
              <p className="hidden font-display text-[15px] italic text-ink-soft sm:block">Good morning, {profile?.display_name?.split(" ")[0] ?? "Elena"}</p>
              <div className="relative ml-auto hidden w-72 md:block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-line-soft bg-paper py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-soft/70 focus:border-teal/40 focus:ring-2 focus:ring-teal/15" placeholder="Search labs, meds, providers…" aria-label="Search care information" />
                {filteredItems && <div className="absolute left-0 right-0 top-11 rounded-lg border border-line-soft bg-surface p-2 shadow-lg"><p className="px-2 py-1 text-[10px] uppercase tracking-wide text-ink-soft">Matches</p>{filteredItems.length ? filteredItems.map((item) => <button type="button" key={item} onClick={() => setSearch(item)} className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-paper">{item}</button>) : <p className="px-2 py-2 text-xs text-ink-soft">No matching care items.</p>}</div>}
              </div>
              <button type="button" onClick={() => toast("You have one care update to review.")} className="relative grid size-9 place-items-center rounded-lg border border-line-soft bg-surface text-ink-soft transition hover:bg-paper" aria-label="Notifications"><Bell className="size-4" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber" /></button>
              <div className="grid size-9 place-items-center rounded-full bg-teal text-[12px] font-semibold text-primary-foreground">{profile?.initials ?? "EV"}</div>
            </div>
          </header>

          <div className="animate-rise px-5 pb-10 pt-6 lg:px-8">
            <div className="max-w-[1180px]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Wednesday · Jun 12</p><h1 className="mt-1 max-w-[30ch] font-display text-[34px] font-medium leading-[1.05]">Let's review your care plan.</h1></div>
                <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-medium text-green"><span className="h-1.5 w-1.5 rounded-full bg-green" />All labs reviewed</span><span className="inline-flex items-center gap-1.5 rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[12px] text-ink-soft">Next refill · 4 days</span></div>
              </div>

              <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-line-soft bg-surface p-5 transition-all duration-300 hover:border-teal/20 hover:shadow-xl lg:flex-row lg:items-center">
                <div className="flex gap-4"><div className="grid w-16 shrink-0 place-items-center rounded-xl bg-teal-soft py-3 text-teal"><p className="font-display text-[28px] font-medium leading-none">14</p><p className="text-[10px] font-semibold uppercase tracking-wide">Jun</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">Upcoming · {appointment?.appointment_type?.toLowerCase() ?? "video visit"}</p><h2 className="mt-1 font-display text-[20px] font-medium leading-tight">{appointment?.specialty ?? "Cardiology follow-up"}</h2><p className="mt-1 text-[13px] text-ink-soft">{appointment?.clinician_name ?? "Dr. Maya Alvarez"} · {appointment?.start_time ?? "10:00 AM"} – {appointment?.end_time ?? "10:30 AM"}</p><div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">{(appointment?.notes ?? ["Bring BP log", "Bring medication list"]).map((note) => <span key={note} className="rounded-md bg-paper px-2 py-1 text-ink-soft">{note}</span>)}</div></div></div>
                <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto"><button type="button" onClick={() => toast("Your video visit link will appear here shortly before the appointment.")} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition hover:bg-teal/90">Join visit</button><button type="button" onClick={() => toast("Rescheduling will open your available care times.")} className="rounded-lg border border-line-soft bg-surface px-4 py-2.5 text-[13px] font-medium text-foreground transition hover:bg-paper">Reschedule</button><button type="button" onClick={() => selectNav("Appointments")} className="text-[13px] font-medium text-ink-soft hover:text-foreground">Details</button></div>
              </section>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <section className="rounded-2xl border border-line-soft bg-surface p-5 transition-all duration-300 hover:shadow-xl lg:col-span-2"><div className="flex items-center justify-between"><h2 className="font-display text-[17px] font-medium">Health snapshot</h2><span className="text-[11px] text-ink-soft">Last 7 days</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{(loading ? Array.from({ length: 4 }, (_, index) => ({ label: `Metric ${index + 1}`, value: "—", unit: null, trend: "Loading", status: "neutral" })) : metrics).map((metric) => <div key={metric.label} className="rounded-lg bg-paper/70 p-3"><p className="text-[11px] text-ink-soft">{metric.label}</p><p className="mt-1 text-[20px] font-semibold leading-none">{metric.value} {metric.unit && <span className="text-[12px] font-normal text-ink-soft">{metric.unit}</span>}</p><p className={`mt-1.5 text-[11px] font-medium ${metric.status === "good" ? "text-green" : "text-ink-soft"}`}>{metric.trend}</p></div>)}</div><div className="mt-4 flex h-11 items-end gap-1.5" aria-label="Daily activity trend">{[22, 30, 26, 38, 32, 44, 40].map((height, index) => <div key={index} className="flex-1 rounded-t bg-teal" style={{ height: `${height}px`, opacity: 0.25 + index * 0.1 }} />)}</div><p className="mt-2 text-[11px] text-ink-soft">Daily activity · steps, 7-day trend</p></section>
                <section className="rounded-2xl border border-line-soft bg-surface p-5"><h2 className="font-display text-[17px] font-medium">Recent activity</h2><ol className="mt-4 space-y-3.5">{activities.map((activity) => <li key={activity.event_title} className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${activity.accent === "cobalt" ? "bg-cobalt" : activity.accent === "amber" ? "bg-amber" : activity.accent === "line" ? "bg-line-soft" : "bg-teal"}`} /><div className="leading-tight"><p className="text-[13px]">{activity.event_title}</p><p className="mt-0.5 text-[11px] text-ink-soft">{activity.event_date} · {activity.detail}</p></div></li>)}</ol></section>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <section className="rounded-2xl border border-line-soft bg-surface p-5 transition-all duration-300 hover:shadow-xl lg:col-span-2"><div className="flex items-center justify-between"><h2 className="font-display text-[17px] font-medium">Lab results</h2><button type="button" onClick={() => selectNav("Lab results")} className="text-[12px] font-medium text-teal hover:underline">View all <ChevronRight className="inline size-3" /></button></div><div className="mt-4 divide-y divide-line-soft">{labs.map((lab) => <div key={lab.test_name} className="flex items-center gap-3 py-2.5"><p className="w-40 shrink-0 text-[13px] font-medium">{lab.test_name}</p><p className="text-[13px] text-ink-soft">{lab.result_value} {lab.result_unit}</p><span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium ${lab.status === "Normal" ? "bg-green-soft text-green" : lab.status === "Review" ? "bg-amber-soft text-amber" : "inline-flex items-center gap-1.5 bg-cobalt-soft text-cobalt"}`}>{lab.status === "Pending" && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cobalt" />}{lab.status}</span></div>)}</div></section>
                <section className="rounded-2xl border border-line-soft bg-surface p-5"><h2 className="font-display text-[17px] font-medium">Medications</h2><div className="mt-4 space-y-3">{medications.map((medication) => <div key={medication.medication_name} className="rounded-lg bg-paper/70 p-3"><div className="flex items-center justify-between"><p className="text-[13px] font-medium">{medication.medication_name} {medication.dosage}</p><span className="text-[11px] text-ink-soft">{medication.schedule}</span></div><p className="mt-1 text-[11px] text-ink-soft">{medication.note}</p></div>)}</div></section>
              </div>

              <section className="mt-5 overflow-hidden rounded-2xl border border-cobalt/20 bg-cobalt-soft/60 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-cobalt text-primary-foreground"><Sparkles className="size-5" /></div><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cobalt">Care assistant · assistive</p><h2 className="mt-0.5 font-display text-[19px] font-medium">Have questions about your results?</h2><p className="mt-1 text-[13px] text-ink-soft">I can help you understand reports and prep for your visit. I don't diagnose — your care team confirms everything.</p></div><div className="flex gap-2 sm:ml-auto"><button type="button" onClick={() => setAssistantOpen(true)} className="rounded-lg bg-cobalt px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition hover:bg-cobalt/90">Ask a question</button><button type="button" onClick={() => toast("Your latest care summary is ready for review.")} className="rounded-lg border border-cobalt/25 bg-surface px-4 py-2.5 text-[13px] font-medium text-cobalt transition hover:bg-cobalt-soft">See summary</button></div></div></section>
            </div>
          </div>
        </main>
      </div>
      <p className="px-5 pb-6 pt-2 text-center text-[10px] text-ink-soft">DHANVATARI · One connected healthcare experience — from care to clarity.</p>

      {assistantOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center"><div className="w-full max-w-lg rounded-2xl border border-line-soft bg-surface p-5 shadow-2xl"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-xl bg-cobalt-soft text-cobalt"><Sparkles className="size-4" /></div><div><h2 className="font-display text-lg">Ask the care assistant</h2><p className="text-[11px] text-ink-soft">Assistive guidance, not a diagnosis</p></div></div><button type="button" onClick={() => setAssistantOpen(false)} className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-paper" aria-label="Close assistant"><X className="size-4" /></button></div><div className="mt-5 rounded-xl bg-paper p-3 text-sm text-ink-soft"><CircleHelp className="mr-2 inline size-4 text-cobalt" />Try asking about a lab value, a visit, or how to prepare for your care team.</div><textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} className="mt-4 min-h-28 w-full resize-none rounded-xl border border-line-soft bg-surface p-3 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15" placeholder="What would you like to understand?" aria-label="Assistant question" /><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setAssistantOpen(false)} className="rounded-lg border border-line-soft px-4 py-2 text-sm font-medium">Cancel</button><button type="button" onClick={() => { setAssistantOpen(false); setAssistantText(""); toast("Your question is saved for a care-team-reviewed response."); }} disabled={!assistantText.trim()} className="rounded-lg bg-cobalt px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Send question</button></div></div></div>}
    </div>
  );
}