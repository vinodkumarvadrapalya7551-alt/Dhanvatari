import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Bell, CalendarDays, Camera, ChevronRight, CircleHelp, ClipboardList, Download, FileText, HeartPulse, Home, LogIn, LogOut, Mail, MapPin, MessageCircle, Pill, Search, ShieldCheck, Sparkles, Stethoscope, UserRound, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DHANVATARI Patient Portal" },
      { name: "description", content: "A calm, connected healthcare experience for appointments, lab results, medications, and care guidance." },
      { property: "og:title", content: "DHANVATARI Patient Portal" },
      { property: "og:description", content: "One connected healthcare experience â€” from care to clarity." },
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
type AvatarMessage = { role: "assistant" | "user"; text: string };
type Hospital = { name: string; town: string; district: string; address: string; specialty: string };
type LiveLocation = { latitude: number; longitude: number; accuracy: number };
type LocationOption = { district: string; towns: string[] };

const demoId = "11111111-1111-4111-8111-111111111111";
const initialAvatarMessages: AvatarMessage[] = [
  { role: "assistant", text: "Hi, Iâ€™m Avatar. I can help you understand symptoms, conditions, medicines, and lab results. What would you like to ask?" },
];
const demoLabReports: Lab[] = [
  { test_name: "Blood pressure", result_value: "118/76", result_unit: "mmHg", status: "Normal" },
  { test_name: "LDL cholesterol", result_value: "128", result_unit: "mg/dL", status: "Review" },
  { test_name: "Triglycerides", result_value: "146", result_unit: "mg/dL", status: "Normal" },
  { test_name: "TSH", result_value: "2.18", result_unit: "mIU/L", status: "Normal" },
  { test_name: "C-reactive protein", result_value: "2.4", result_unit: "mg/L", status: "Pending" },
];
const hospitals: Hospital[] = [
  { name: "Narayana Health City", town: "Bengaluru", district: "Bengaluru Urban", address: "258/A, Bommasandra Industrial Area, Bengaluru", specialty: "Cardiology and multi-specialty care" },
  { name: "Manipal Hospital Whitefield", town: "Bengaluru", district: "Bengaluru Urban", address: "#143, 212, EPIP Industrial Area, Whitefield, Bengaluru", specialty: "Multi-specialty consultation" },
  { name: "District Hospital Chikkaballapur", town: "Chikkaballapur", district: "Chikkaballapur", address: "B.B. Road, Chikkaballapur, Karnataka", specialty: "General and specialist outpatient care" },
  { name: "Akash Hospital", town: "Devanahalli", district: "Bengaluru Rural", address: "Prasannahalli Road, Devanahalli, Karnataka", specialty: "General and emergency care" },
];
const indiaLocations: Record<string, LocationOption[]> = {
  Karnataka: [
    { district: "Bengaluru Urban", towns: ["Bengaluru"] },
    { district: "Bengaluru Rural", towns: ["Devanahalli"] },
    { district: "Chikkaballapur", towns: ["Chikkaballapur"] },
  ],
  Maharashtra: [{ district: "Pune", towns: ["Pune", "Pimpri-Chinchwad"] }, { district: "Mumbai Suburban", towns: ["Mumbai"] }],
  Telangana: [{ district: "Hyderabad", towns: ["Hyderabad", "Secunderabad"] }, { district: "Rangareddy", towns: ["Gachibowli"] }],
  "Tamil Nadu": [{ district: "Chennai", towns: ["Chennai"] }, { district: "Coimbatore", towns: ["Coimbatore"] }],
};

function getAvatarReply(question: string): string {
  const q = question.toLowerCase();

  const urgent = ["chest pain", "trouble breathing", "can't breathe", "cannot breathe", "stroke", "face drooping", "severe bleeding", "unconscious", "heart attack", "paralysis"];
  if (urgent.some((s) => q.includes(s))) {
    return "ðŸš¨ Emergency: Call 112 (India) or your local emergency number immediately. Go to the nearest emergency department now. Do not wait â€” these symptoms can be life-threatening.";
  }

  // Head / neck
  if (q.includes("head") && (q.includes("pain") || q.includes("ache") || q.includes("hurt"))) {
    return "Head pain condition: Likely tension headache, migraine, dehydration, or high blood pressure.

Immediate care: Rest in a quiet dark room, drink 2â€“3 glasses of water, apply a cold or warm compress to your forehead.

Treatment: Paracetamol 500 mg or Ibuprofen 400 mg (with food) for mild-to-moderate pain. Avoid screens and bright light.

See a doctor if: pain is sudden and severe ('thunderclap'), comes with fever, stiff neck, vision changes, vomiting, or lasts more than 2 days.";
  }
  if (q.includes("neck") && (q.includes("pain") || q.includes("stiff") || q.includes("ache"))) {
    return "Neck pain condition: Likely muscle strain, poor posture, or cervical spondylosis.

Immediate care: Apply a warm compress for 15 minutes, gently stretch side to side, avoid sudden movements.

Treatment: Ibuprofen 400 mg with food, neck support pillow at night, physiotherapy exercises.

See a doctor if: pain radiates to arms, causes numbness or tingling, follows an injury, or is accompanied by fever.";
  }

  // Chest
  if (q.includes("chest") && (q.includes("pain") || q.includes("tight") || q.includes("pressure") || q.includes("ache"))) {
    return "âš ï¸ Chest pain condition: Could be muscle strain, acid reflux, anxiety, or â€” importantly â€” a cardiac issue.

Immediate care: Sit upright and rest. If pain is crushing, spreads to arm or jaw, or comes with sweating or breathlessness, call 112 now.

Treatment (non-cardiac): Antacids for reflux, Paracetamol for muscle pain, deep breathing for anxiety.

See a doctor urgently if: pain is severe, lasts more than 15 minutes, or you have a history of heart disease.";
  }

  // Back
  if ((q.includes("back") || q.includes("spine") || q.includes("lower back") || q.includes("lumbar")) && (q.includes("pain") || q.includes("ache") || q.includes("hurt"))) {
    return "Back pain condition: Likely muscle strain, disc issue, or poor posture. Very common and usually manageable.

Immediate care: Rest for 1â€“2 days (avoid complete bed rest), apply a warm compress, avoid heavy lifting.

Treatment: Ibuprofen 400 mg with food (3x daily), gentle stretching, lumbar support while sitting.

See a doctor if: pain shoots down the leg (sciatica), causes weakness or numbness, follows an injury, or you lose bladder/bowel control.";
  }

  // Stomach / abdomen
  if ((q.includes("stomach") || q.includes("abdomen") || q.includes("belly") || q.includes("abdominal") || q.includes("tummy")) && (q.includes("pain") || q.includes("ache") || q.includes("cramp"))) {
    return "Abdominal pain condition: Could be indigestion, gas, gastritis, IBS, or infection.

Immediate care: Drink warm water, avoid spicy/oily food, rest lying on your back with knees bent.

Treatment: Antacids (Gelusil/Digene) for acidity, ORS for diarrhoea, Buscopan for cramps. Avoid NSAIDs on an empty stomach.

See a doctor if: pain is severe or worsening, localised to lower right (appendix), comes with high fever, vomiting blood, or lasts more than 24 hours.";
  }

  // Knee / leg
  if ((q.includes("knee") || q.includes("leg") || q.includes("calf") || q.includes("thigh")) && (q.includes("pain") || q.includes("ache") || q.includes("swollen") || q.includes("swelling"))) {
    return "Knee/leg pain condition: Likely muscle strain, ligament sprain, arthritis, or overuse injury.

Immediate care: RICE method â€” Rest, Ice (15 min every 2 hours), Compression bandage, Elevate the leg.

Treatment: Ibuprofen 400 mg with food, topical Diclofenac gel, avoid weight-bearing activities for 48 hours.

See a doctor if: joint is visibly deformed, swelling is severe, you cannot bear weight, or pain follows a fall or accident.";
  }

  // Shoulder / arm
  if ((q.includes("shoulder") || q.includes("arm") || q.includes("elbow") || q.includes("wrist")) && (q.includes("pain") || q.includes("ache") || q.includes("stiff"))) {
    return "Shoulder/arm pain condition: Likely rotator cuff strain, frozen shoulder, tennis elbow, or repetitive strain.

Immediate care: Rest the arm, apply ice for 15 minutes, avoid overhead movements.

Treatment: Ibuprofen 400 mg with food, topical Diclofenac gel, gentle pendulum exercises for shoulder.

See a doctor if: you cannot lift the arm, pain is severe after injury, or there is visible deformity or numbness.";
  }

  // Foot / ankle
  if ((q.includes("foot") || q.includes("ankle") || q.includes("heel") || q.includes("toe")) && (q.includes("pain") || q.includes("ache") || q.includes("swollen"))) {
    return "Foot/ankle pain condition: Likely sprain, plantar fasciitis, gout, or overuse.

Immediate care: RICE â€” Rest, Ice, Compression, Elevation. Avoid walking on it if painful.

Treatment: Ibuprofen 400 mg with food, supportive footwear, arch support insoles for heel pain.

See a doctor if: ankle is visibly deformed, you heard a 'pop', swelling is severe, or pain does not improve in 3 days.";
  }

  // Fever
  if (q.includes("fever") || q.includes("temperature") || q.includes("chills")) {
    return "Fever condition: Body temperature above 38Â°C. Common causes â€” viral infection, flu, UTI, or dengue.

Immediate care: Rest, drink 3â€“4 litres of fluids daily (ORS, coconut water, soups), wear light clothing.

Treatment: Paracetamol 500â€“1000 mg every 6 hours (max 4g/day). Do NOT use Aspirin in children.

See a doctor if: fever exceeds 39.5Â°C, lasts more than 3 days, comes with rash, stiff neck, severe headache, difficulty breathing, or you are pregnant or immunocompromised.";
  }

  // Joint pain
  if ((q.includes("joint") || q.includes("arthritis") || q.includes("rheumatoid")) && (q.includes("pain") || q.includes("swollen") || q.includes("stiff"))) {
    return "Joint pain condition: Could be osteoarthritis, rheumatoid arthritis, gout, or reactive arthritis.

Immediate care: Rest the joint, apply ice for acute flare, warm compress for chronic stiffness.

Treatment: Ibuprofen 400 mg with food, topical Diclofenac gel, gentle range-of-motion exercises.

See a doctor for: blood tests (uric acid, CRP, RF factor), X-ray, and a long-term management plan if pain is recurring.";
  }

  // General pain without location
  if (q.includes("pain") || q.includes("ache") || q.includes("hurt") || q.includes("sore")) {
    return "To give you the most accurate guidance, please tell me the exact location of your pain (e.g. head, neck, chest, back, stomach, knee, shoulder, foot).

Also share: severity from 0â€“10, when it started, whether it is constant or comes and goes, and any other symptoms like fever, swelling, or numbness. I will then give you specific treatment steps.";
  }

  if (q.includes("disease") || q.includes("diagnos") || q.includes("what do i have") || q.includes("condition")) {
    return "To help identify your condition, please describe: the main symptom and exact body location, how long you have had it, severity (0â€“10), any fever, swelling, or other signs, and your age group and any known medical conditions. I will give you the most likely condition and recommended treatment steps.";
  }

  return "Hi! I can give you specific treatment guidance for body pain and health conditions. Tell me:
â€¢ Where exactly is the pain or symptom?
â€¢ How severe is it (0â€“10)?
â€¢ How long have you had it?
â€¢ Any other symptoms (fever, swelling, numbness)?

I will identify the likely condition and give you step-by-step care advice.";
}

function pdfSafe(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "?").replace(/[\\()]/g, "\\$&");
}

function downloadLabReportsPdf(labReports: Lab[]): void {
  const reportLines = [
    "DHANVATARI PATIENT PORTAL",
    "Recent laboratory results",
    `Generated ${new Date().toLocaleDateString()}`,
    "",
    ...labReports.flatMap((lab) => [
      `${lab.test_name}: ${lab.result_value} ${lab.result_unit}`,
      `Status: ${lab.status}`,
      "",
    ]),
    "This report is for personal health records. Discuss results with your care team.",
  ];
  const reportTitle = "DHANVATARI PATIENT PORTAL";
  const detailLines = reportLines.slice(1).map((line) => line ?? "");
  const contentLines = ["BT", "/F1 16 Tf", "50 750 Td", `(${pdfSafe(reportTitle)}) Tj`, "/F1 11 Tf", "0 -28 Td", ...detailLines.flatMap((line) => [`(${pdfSafe(line)}) Tj`, "0 -18 Td"]), "ET"];
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${contentLines.join("
").length} >>
stream
${contentLines.join("
")}
endstream`,
  ];
  let pdf = "%PDF-1.4
";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj
${object}
endobj
`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("
")}
trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;
  const downloadUrl = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "dhanvatari-lab-reports.pdf";
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatCurrentDateTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function AuthScreen({ onGuest, onAuthenticated }: { onGuest: () => void; onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone } } });
    setSubmitting(false);
    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setErrorMessage("Check your email to confirm your account, then sign in.");
      return;
    }
    onAuthenticated();
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin, queryParams: { prompt: "select_account" } } });
    if (error) {
      const providerDisabled = error.message.toLowerCase().includes("provider is not enabled");
      setErrorMessage(providerDisabled ? "Google login is not enabled for this workspace yet. Use email login or ask the workspace administrator to enable Google in Supabase Authentication settings." : error.message);
    }
  };

  return <main className="min-h-screen bg-paper px-5 py-6 text-foreground sm:px-8 lg:px-12"><div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-[1240px] flex-col overflow-hidden rounded-[28px] border border-line-soft bg-surface shadow-[0_24px_80px_rgba(18,73,66,0.12)] lg:flex-row"><section className="relative flex flex-1 flex-col justify-between overflow-hidden bg-teal px-7 py-8 text-primary-foreground sm:px-12 sm:py-10 lg:min-h-[720px] lg:px-16"><div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/15" /><div className="absolute -bottom-28 -left-24 size-80 rounded-full border border-white/10" /><div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-white/15 sm:right-14"><Stethoscope className="size-36 stroke-[1.1] sm:size-48" /></div><div className="relative"><div className="flex items-center gap-2.5"><div className="grid size-10 place-items-center rounded-xl bg-white/15 text-primary-foreground"><Stethoscope className="size-5 stroke-[1.8]" /></div><div><p className="text-[11px] font-bold tracking-[0.16em]">DHANVATARI</p><p className="text-[10px] text-primary-foreground/65">Patient portal</p></div></div><div className="mt-20 max-w-md sm:mt-28"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">Your care, connected</p><h1 className="mt-4 font-display text-[clamp(42px,5vw,72px)] font-medium leading-[0.95]">A calmer way to understand your health.</h1><p className="mt-6 max-w-sm text-[15px] leading-relaxed text-primary-foreground/75">Keep appointments, results, medications, and questions together in one private space.</p></div></div><div className="relative mt-16 flex items-center gap-3 text-[12px] text-primary-foreground/70"><ShieldCheck className="size-5" /><span>Built around privacy, clarity, and your care team.</span></div></section><section className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[500px] lg:px-16"><div className="mx-auto w-full max-w-sm"><div className="mb-8"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">Welcome back</p><h2 className="mt-2 font-display text-[34px] font-medium leading-tight">{mode === "login" ? "Sign in to your care space." : "Create your care space."}</h2><p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{mode === "login" ? "Pick up where you left off, securely." : "Your details help your care team keep your record connected."}</p></div><div className="mb-6 grid grid-cols-2 rounded-xl bg-paper p-1 text-[12px] font-semibold"><button type="button" onClick={() => { setMode("login"); setErrorMessage(""); }} className={`rounded-lg px-3 py-2.5 transition ${mode === "login" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"}`}>Log in</button><button type="button" onClick={() => { setMode("signup"); setErrorMessage(""); }} className={`rounded-lg px-3 py-2.5 transition ${mode === "signup" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"}`}>Create account</button></div><button type="button" onClick={handleGoogleLogin} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line-soft bg-surface px-4 py-3 text-[13px] font-semibold transition hover:bg-paper"><span className="grid size-5 place-items-center rounded-full border border-line-soft text-[11px] font-bold">G</span>Continue with Google</button><div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-ink-soft"><span className="h-px flex-1 bg-line-soft" />or continue with email<span className="h-px flex-1 bg-line-soft" /></div><form onSubmit={handleSubmit} className="space-y-3.5">{mode === "signup" && <><label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Full name</span><div className="relative"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" /><input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-xl border border-line-soft bg-paper/50 py-3 pl-10 pr-3 text-[13px] outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/15" placeholder="Your original name" /></div></label><label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Phone number</span><input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-line-soft bg-paper/50 px-3 py-3 text-[13px] outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/15" placeholder="+1 (555) 000-0000" /></label></>}<label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Email address</span><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-line-soft bg-paper/50 py-3 pl-10 pr-3 text-[13px] outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/15" placeholder="you@example.com" /></div></label><label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Password</span><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-line-soft bg-paper/50 px-3 py-3 text-[13px] outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/15" placeholder="At least 6 characters" /></label>{errorMessage && <p className="rounded-lg bg-amber-soft px-3 py-2.5 text-[12px] leading-relaxed text-amber">{errorMessage}</p>}<button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-teal/90 disabled:opacity-50">{submitting ? "Connecting..." : mode === "login" ? "Enter my care space" : "Create my account"}<ArrowRight className="size-4" /></button></form><div className="mt-7 border-t border-line-soft pt-5 text-center"><button type="button" onClick={onGuest} className="text-[12px] font-semibold text-cobalt hover:underline">Continue as a guest</button><p className="mt-2 text-[10px] leading-relaxed text-ink-soft">Guest mode opens the demo workspace. No account or personal details required.</p></div></div></section></div></main>;
}

function DhanvatariDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [labReportsOpen, setLabReportsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [avatarMessages, setAvatarMessages] = useState<AvatarMessage[]>(initialAvatarMessages);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [hospitalsOpen, setHospitalsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
    const [selectedState, setSelectedState] = useState("Karnataka"); // Default state
  const [selectedDistrict, setSelectedDistrict] = useState("Bengaluru Urban");
  const [selectedTown, setSelectedTown] = useState("Bengaluru");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const isGuest = window.localStorage.getItem("dhanvatari-guest-mode") === "true";
      setAuthenticated(Boolean(data.session));
      setGuestMode(!data.session && isGuest);
      setAuthChecked(true);
    };
    void checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthenticated(Boolean(session));
      if (session) {
        setGuestMode(false);
        setAvatarMessages(initialAvatarMessages);
        window.localStorage.removeItem("dhanvatari-guest-mode");
      }
      setAuthChecked(true);
    });
    return () => { active = false; authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDateTime(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const historyKey = guestMode ? "dhanvatari-avatar-history-guest" : authenticated ? "dhanvatari-avatar-history-user" : null;
    if (!historyKey) return;
    try {
      const savedHistory = window.localStorage.getItem(historyKey);
      if (!savedHistory) return;
      const parsedHistory = JSON.parse(savedHistory) as AvatarMessage[];
      if (Array.isArray(parsedHistory) && parsedHistory.every((message) => message?.role && typeof message.text === "string")) {
        setAvatarMessages(parsedHistory);
      }
    } catch {
      window.localStorage.removeItem(historyKey);
    }
  }, [authChecked, authenticated, guestMode]);

  useEffect(() => {
    const savedPhoto = window.localStorage.getItem("dhanvatari-avatar-photo");
    if (savedPhoto) setAvatarPhoto(savedPhoto);
  }, []);

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
      const loadedLabs = labResult.data ?? [];
      const loadedLabNames = new Set(loadedLabs.map((lab) => lab.test_name));
      setLabs([...loadedLabs, ...demoLabReports.filter((lab) => !loadedLabNames.has(lab.test_name))].slice(0, 8));
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

  const askAvatar = () => {
    const question = assistantText.trim();
    if (!question) return;
    const nextMessages = [...avatarMessages, { role: "user" as const, text: question }, { role: "assistant" as const, text: getAvatarReply(question) }];
    setAvatarMessages(nextMessages);
    const historyKey = guestMode ? "dhanvatari-avatar-history-guest" : authenticated ? "dhanvatari-avatar-history-user" : null;
    if (historyKey) window.localStorage.setItem(historyKey, JSON.stringify(nextMessages));
    setAssistantText("");
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [avatarMessages]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setAvatarPhoto(reader.result);
      window.localStorage.setItem("dhanvatari-avatar-photo", reader.result);
      toast.success("Profile photo updated.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) toast.error("Login could not be started. Please try again.");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Logout could not be completed.");
    else {
      window.localStorage.removeItem("dhanvatari-guest-mode");
      setGuestMode(false);
      toast.success("You have been logged out.");
    }
  };

  const continueAsGuest = () => {
    window.localStorage.setItem("dhanvatari-guest-mode", "true");
    window.localStorage.removeItem("dhanvatari-avatar-history-guest");
    setAvatarMessages(initialAvatarMessages);
    setGuestMode(true);
    setAuthChecked(true);
  };

  const greetingName = guestMode ? "Guest" : "Vinod Kumar K";
  const nearbyHospitals = selectedState === "Karnataka" ? hospitals.filter((hospital) => hospital.district === selectedDistrict && hospital.town === selectedTown) : [];
  const stateLocations = indiaLocations[selectedState] ?? [];
  const districtLocations = stateLocations.find((location) => location.district === selectedDistrict) ?? stateLocations[0];
  const availableDistricts = stateLocations.map((location) => location.district);
  const availableTowns = districtLocations?.towns ?? [];

  useEffect(() => {
    const firstDistrict = stateLocations[0];
    if (!firstDistrict) return;
    if (!availableDistricts.includes(selectedDistrict)) setSelectedDistrict(firstDistrict.district);
    if (!availableTowns.includes(selectedTown)) setSelectedTown(firstDistrict.towns[0] ?? "");
  }, [selectedState, stateLocations]);
  const minimumDate = new Date().toISOString().slice(0, 10);
  const appointmentLocationLabel = selectedTown === "Bengaluru" ? "Bengaluru, Karnataka" : `${selectedTown}, Karnataka`;
  const emergencyMapUrl = liveLocation
    ? `https://www.google.com/maps/search/emergency+hospitals/@${liveLocation.latitude},${liveLocation.longitude},13z`
    : `https://www.google.com/maps/search/emergency+hospitals+near+${encodeURIComponent(appointmentLocationLabel)}`;

  const useLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Live location is not supported by this browser.");
      return;
    }
    setLocationStatus("Requesting your location permission...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLiveLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
        setLocationStatus("Live location added. Hospital results can now be opened near you.");
      },
      () => setLocationStatus("Location permission was not granted. You can still search by town."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };





  if (!authChecked) return <div className="grid min-h-screen place-items-center bg-paper text-sm text-ink-soft">Preparing your care space...</div>;
  if (!authenticated && !guestMode) return <AuthScreen onGuest={continueAsGuest} onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-paper font-sans text-foreground antialiased" onClick={() => setProfileMenuOpen(false)}>
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
              <p className="hidden font-display text-[15px] italic text-ink-soft sm:block">{getTimeGreeting()}, {greetingName}</p>
              <div className="relative ml-auto hidden w-72 md:block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-line-soft bg-paper py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-soft/70 focus:border-teal/40 focus:ring-2 focus:ring-teal/15" placeholder="Search labs, meds, providersâ€¦" aria-label="Search care information" />
                {filteredItems && <div className="absolute left-0 right-0 top-11 rounded-lg border border-line-soft bg-surface p-2 shadow-lg"><p className="px-2 py-1 text-[10px] uppercase tracking-wide text-ink-soft">Matches</p>{filteredItems.length ? filteredItems.map((item) => <button type="button" key={item} onClick={() => setSearch(item)} className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-paper">{item}</button>) : <p className="px-2 py-2 text-xs text-ink-soft">No matching care items.</p>}</div>}
              </div>
              <button type="button" onClick={() => toast("You have one care update to review.")} className="relative grid size-9 place-items-center rounded-lg border border-line-soft bg-surface text-ink-soft transition hover:bg-paper" aria-label="Notifications"><Bell className="size-4" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber" /></button>
              <div className="relative" onClick={(e) => e.stopPropagation()}><button type="button" onClick={() => setProfileMenuOpen((open) => !open)} className="grid size-9 overflow-hidden rounded-full bg-teal text-[12px] font-semibold text-primary-foreground ring-offset-2 transition hover:ring-2 hover:ring-teal/30" aria-label="Open patient profile" aria-expanded={profileMenuOpen} aria-controls="patient-profile-menu">{avatarPhoto && !guestMode ? <img src={avatarPhoto} alt="Patient profile" className="size-full object-cover" /> : guestMode ? "G" : "VK"}</button>
                {profileMenuOpen && <div id="patient-profile-menu" className="absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-xl border border-line-soft bg-surface shadow-xl"><div className="flex items-center gap-3 border-b border-line-soft bg-paper/60 p-4"><div className="grid size-11 shrink-0 overflow-hidden place-items-center rounded-full bg-teal text-sm font-semibold text-primary-foreground">{avatarPhoto && !guestMode ? <img src={avatarPhoto} alt="" className="size-full object-cover" /> : guestMode ? "G" : "VK"}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{guestMode ? "Guest" : "Vinod Kumar K"}</p><p className="text-[11px] text-ink-soft">{guestMode ? "Guest access" : "Patient profile"}</p></div></div><div className="p-3"><label className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-soft transition hover:bg-paper hover:text-foreground"><Camera className="size-4" />Add or change photo<input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} /></label><div className="mt-2 border-t border-line-soft pt-3"><p className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Recent Avatar questions</p>{avatarMessages.filter((message) => message.role === "user").slice(-3).reverse().map((message, index) => <button type="button" key={`${message.text}-${index}`} onClick={() => { setAssistantOpen(true); setProfileMenuOpen(false); }} className="mt-1.5 block w-full truncate rounded-lg px-2.5 py-2 text-left text-[12px] text-ink-soft hover:bg-paper hover:text-foreground">{message.text}</button>)}{!avatarMessages.some((message) => message.role === "user") && <p className="px-2.5 py-2 text-[12px] text-ink-soft">Your typed questions will appear here.</p>}</div><div className="mt-3 flex gap-2 border-t border-line-soft pt-3"><button type="button" onClick={handleLogin} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-soft px-2.5 py-2 text-[12px] font-medium hover:bg-paper"><LogIn className="size-3.5" />Log in</button><button type="button" onClick={handleLogout} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-2.5 py-2 text-[12px] font-medium text-background hover:opacity-90"><LogOut className="size-3.5" />Log out</button></div></div></div>}
              </div>
            </div>
          </header>

          <div className="animate-rise px-5 pb-10 pt-6 lg:px-8">
            <div className="max-w-[1180px]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">{formatCurrentDateTime(currentDateTime)}</p><h1 className="mt-1 max-w-[30ch] font-display text-[34px] font-medium leading-[1.05]">Let's review your care plan.</h1></div>
                <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-medium text-green"><span className="h-1.5 w-1.5 rounded-full bg-green" />All labs reviewed</span><button type="button" onClick={() => setLocationOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[12px] text-ink-soft transition hover:bg-paper hover:text-foreground"><MapPin className="size-3.5 text-teal" />{appointmentLocationLabel}</button><span className="inline-flex items-center gap-1.5 rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[12px] text-ink-soft">Next refill Â· 4 days</span></div>
              </div>

              <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-line-soft bg-surface p-5 transition-all duration-300 hover:border-teal/20 hover:shadow-xl lg:flex-row lg:items-center">
                <div className="flex gap-4"><div className="grid w-16 shrink-0 place-items-center rounded-xl bg-teal-soft py-3 text-teal"><p className="font-display text-[28px] font-medium leading-none">14</p><p className="text-[10px] font-semibold uppercase tracking-wide">Jun</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">Upcoming Â· {appointment?.appointment_type?.toLowerCase() ?? "video visit"}</p><h2 className="mt-1 font-display text-[20px] font-medium leading-tight">{appointment?.specialty ?? "Cardiology follow-up"}</h2><p className="mt-1 text-[13px] text-ink-soft">{appointment?.clinician_name ?? "Dr. Maya Alvarez"} Â· {appointment?.start_time ?? "10:00 AM"} â€“ {appointment?.end_time ?? "10:30 AM"}</p><div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">{(appointment?.notes ?? ["Bring BP log", "Bring medication list"]).map((note) => <span key={note} className="rounded-md bg-paper px-2 py-1 text-ink-soft">{note}</span>)}</div></div></div>
                <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto"><button type="button" onClick={() => setHospitalsOpen(true)} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition hover:bg-teal/90">Join visit</button><button type="button" onClick={() => setRescheduleOpen(true)} className="rounded-lg border border-line-soft bg-surface px-4 py-2.5 text-[13px] font-medium text-foreground transition hover:bg-paper">Reschedule</button><button type="button" onClick={() => selectNav("Appointments")} className="text-[13px] font-medium text-ink-soft hover:text-foreground">Details</button></div>
              </section>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <section className="rounded-2xl border border-line-soft bg-surface p-5 transition-all duration-300 hover:shadow-xl lg:col-span-2"><div className="flex items-center justify-between"><h2 className="font-display text-[17px] font-medium">Health snapshot</h2><span className="text-[11px] text-ink-soft">Last 7 days</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{(loading ? Array.from({ length: 4 }, (_, index) => ({ label: `Metric ${index + 1}`, value: "â€”", unit: null, trend: "Loading", status: "neutral" })) : metrics).map((metric) => <div key={metric.label} className="rounded-lg bg-paper/70 p-3"><p className="text-[11px] text-ink-soft">{metric.label}</p><p className="mt-1 text-[20px] font-semibold leading-none">{metric.value} {metric.unit && <span className="text-[12px] font-normal text-ink-soft">{metric.unit}</span>}</p><p className={`mt-1.5 text-[11px] font-medium ${metric.status === "good" ? "text-green" : "text-ink-soft"}`}>{metric.trend}</p></div>)}</div><div className="mt-4 flex h-11 items-end gap-1.5" aria-label="Daily activity trend">{[22, 30, 26, 38, 32, 44, 40].map((height, index) => <div key={index} className="flex-1 rounded-t bg-teal" style={{ height: `${height}px`, opacity: 0.25 + index * 0.1 }} />)}</div><p className="mt-2 text-[11px] text-ink-soft">Daily activity Â· steps, 7-day trend</p></section>
                <section className="rounded-2xl border border-line-soft bg-surface p-5"><h2 className="font-display text-[17px] font-medium">Recent activity</h2><ol className="mt-4 space-y-3.5">{activities.map((activity) => <li key={activity.event_title} className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${activity.accent === "cobalt" ? "bg-cobalt" : activity.accent === "amber" ? "bg-amber" : activity.accent === "line" ? "bg-line-soft" : "bg-teal"}`} /><div className="leading-tight"><p className="text-[13px]">{activity.event_title}</p><p className="mt-0.5 text-[11px] text-ink-soft">{activity.event_date} Â· {activity.detail}</p></div></li>)}</ol></section>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <section className="rounded-2xl border border-line-soft bg-surface p-5 transition-all duration-300 hover:shadow-xl lg:col-span-2"><div className="flex items-center justify-between"><h2 className="font-display text-[17px] font-medium">Lab results</h2><button type="button" onClick={() => setLabReportsOpen(true)} className="text-[12px] font-medium text-teal hover:underline">View all <ChevronRight className="inline size-3" /></button></div><div className="mt-4 divide-y divide-line-soft">{labs.map((lab) => <div key={lab.test_name} className="flex items-center gap-3 py-2.5"><p className="w-40 shrink-0 text-[13px] font-medium">{lab.test_name}</p><p className="text-[13px] text-ink-soft">{lab.result_value} {lab.result_unit}</p><span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium ${lab.status === "Normal" ? "bg-green-soft text-green" : lab.status === "Review" ? "bg-amber-soft text-amber" : "inline-flex items-center gap-1.5 bg-cobalt-soft text-cobalt"}`}>{lab.status === "Pending" && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cobalt" />}{lab.status}</span></div>)}</div></section>
                <section className="rounded-2xl border border-line-soft bg-surface p-5"><h2 className="font-display text-[17px] font-medium">Medications</h2><div className="mt-4 space-y-3">{medications.map((medication) => <div key={medication.medication_name} className="rounded-lg bg-paper/70 p-3"><div className="flex items-center justify-between"><p className="text-[13px] font-medium">{medication.medication_name} {medication.dosage}</p><span className="text-[11px] text-ink-soft">{medication.schedule}</span></div><p className="mt-1 text-[11px] text-ink-soft">{medication.note}</p></div>)}</div></section>
              </div>

              <section className="mt-5 overflow-hidden rounded-2xl border border-cobalt/20 bg-cobalt-soft/60 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-cobalt text-primary-foreground"><Sparkles className="size-5" /></div><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cobalt">Care assistant Â· assistive</p><h2 className="mt-0.5 font-display text-[19px] font-medium">Have questions about your results?</h2><p className="mt-1 text-[13px] text-ink-soft">I can help you understand reports and prep for your visit. I don't diagnose â€” your care team confirms everything.</p></div><div className="flex gap-2 sm:ml-auto"><button type="button" onClick={() => setAssistantOpen(true)} className="rounded-lg bg-cobalt px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition hover:bg-cobalt/90">Ask a question</button><button type="button" onClick={() => toast("Your latest care summary is ready for review.")} className="rounded-lg border border-cobalt/25 bg-surface px-4 py-2.5 text-[13px] font-medium text-cobalt transition hover:bg-cobalt-soft">See summary</button></div></div></section>
            </div>
          </div>
        </main>
      </div>
      <p className="px-5 pb-6 pt-2 text-center text-[10px] text-ink-soft">DHANVATARI Â· One connected healthcare experience â€” from care to clarity.</p>

      {rescheduleOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center"><section className="w-full max-w-md rounded-2xl border border-line-soft bg-surface p-5 shadow-2xl" aria-label="Reschedule appointment"><div className="flex items-start gap-3"><div className="grid size-10 place-items-center rounded-xl bg-teal-soft text-teal"><CalendarDays className="size-5" /></div><div><h2 className="font-display text-xl">Choose a consultation time</h2><p className="mt-1 text-[12px] text-ink-soft">Select a date and time with your doctor.</p></div><button type="button" onClick={() => setRescheduleOpen(false)} className="ml-auto grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-paper" aria-label="Close reschedule"><X className="size-4" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-[12px] font-medium">Date<input type="date" min={minimumDate} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line-soft bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-teal" /></label><label className="text-[12px] font-medium">Time<select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line-soft bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-teal"><option>09:00</option><option>10:00</option><option>11:30</option><option>14:00</option><option>16:30</option></select></label></div><p className="mt-4 rounded-lg bg-paper p-3 text-[11px] leading-relaxed text-ink-soft">Your care team confirms availability before the appointment is finalized.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setRescheduleOpen(false)} className="rounded-lg border border-line-soft px-4 py-2.5 text-[13px] font-medium">Cancel</button><button type="button" disabled={!selectedDate} onClick={() => { setRescheduleOpen(false); toast.success(`Consultation request sent for ${selectedDate} at ${selectedTime}.`); }} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-40">Request appointment</button></div></section></div>}

      {locationOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center"><section className="w-full max-w-md rounded-2xl border border-line-soft bg-surface p-5 shadow-2xl" aria-label="Select care location"><div className="flex items-start gap-3"><div className="grid size-10 place-items-center rounded-xl bg-teal-soft text-teal"><MapPin className="size-5" /></div><div><h2 className="font-display text-xl">Your care location</h2><p className="mt-1 text-[12px] text-ink-soft">Choose an area or use your live location.</p></div><button type="button" onClick={() => setLocationOpen(false)} className="ml-auto grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-paper" aria-label="Close location selector"><X className="size-4" /></button></div><button type="button" onClick={useLiveLocation} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-teal/30 bg-teal-soft px-4 py-2.5 text-[13px] font-semibold text-teal"><MapPin className="size-4" />Use my live location</button>{liveLocation && <p className="mt-2 rounded-lg bg-green-soft px-3 py-2 text-[11px] text-green">Location accuracy: approximately {Math.round(liveLocation.accuracy)} m</p>}{locationStatus && <p className="mt-2 text-[11px] text-ink-soft">{locationStatus}</p>}<div className="mt-5 space-y-3"><label className="block text-[12px] font-medium">State<select value={selectedState} onChange={(event) => setSelectedState(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line-soft bg-paper px-3 py-2.5 text-[13px]"><option>Karnataka</option><option>Maharashtra</option><option>Telangana</option><option>Tamil Nadu</option></select></label><label className="block text-[12px] font-medium">District<select value={selectedDistrict} onChange={(event) => setSelectedDistrict(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line-soft bg-paper px-3 py-2.5 text-[13px]"><option>Bengaluru Urban</option><option>Bengaluru Rural</option><option>Chikkaballapur</option></select></label><label className="block text-[12px] font-medium">Town<select value={selectedTown} onChange={(event) => setSelectedTown(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line-soft bg-paper px-3 py-2.5 text-[13px]"><option>Bengaluru</option><option>Devanahalli</option><option>Chikkaballapur</option></select></label></div><button type="button" onClick={() => { setLocationOpen(false); toast.success(`Location set to ${selectedTown}, ${selectedState}.`); }} className="mt-5 w-full rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-primary-foreground">Save location</button></section></div>}

      {hospitalsOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center"><section className="flex max-h-[min(700px,calc(100vh-32px))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line-soft bg-surface shadow-2xl" aria-label="Nearby hospitals"><div className="flex items-start gap-3 border-b border-line-soft p-5"><div className="grid size-10 place-items-center rounded-xl bg-teal-soft text-teal"><MapPin className="size-5" /></div><div><h2 className="font-display text-xl">Nearby hospitals</h2><p className="mt-1 text-[12px] text-ink-soft">Showing options near {appointmentLocationLabel}.</p></div><button type="button" onClick={() => setHospitalsOpen(false)} className="ml-auto grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-paper" aria-label="Close hospitals"><X className="size-4" /></button></div><div className="overflow-y-auto p-5"><div className="mb-4 rounded-xl border border-amber/20 bg-amber-soft p-3 text-[12px] leading-relaxed"><strong>Emergency?</strong> Call local emergency services first. Use the map for navigation to the nearest available hospital.</div><a href={emergencyMapUrl} target="_blank" rel="noreferrer" className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-primary-foreground">Find emergency hospitals nearby <MapPin className="size-4" /></a><div className="mb-4 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-teal-soft px-2.5 py-1 text-teal">{selectedState}</span><span className="rounded-full bg-paper px-2.5 py-1 text-ink-soft">{selectedDistrict}</span><span className="rounded-full bg-paper px-2.5 py-1 text-ink-soft">{selectedTown}</span></div>{nearbyHospitals.length ? <div className="space-y-3">{nearbyHospitals.map((hospital) => <article key={hospital.name} className="rounded-xl border border-line-soft p-4"><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal text-primary-foreground"><MapPin className="size-4" /></div><div className="min-w-0"><h3 className="text-[14px] font-semibold">{hospital.name}</h3><p className="mt-1 text-[12px] text-ink-soft">{hospital.address}</p><p className="mt-1 text-[11px] text-teal">{hospital.specialty}</p></div></div><button type="button" onClick={() => { setHospitalsOpen(false); toast.success(`${hospital.name} selected for consultation.`); }} className="mt-3 w-full rounded-lg bg-teal px-3 py-2 text-[12px] font-semibold text-primary-foreground">Select hospital</button></article>)}</div> : <p className="py-10 text-center text-sm text-ink-soft">No listed hospitals match this town. Update your location.</p>}</div><div className="border-t border-line-soft bg-paper/50 p-4"><button type="button" onClick={() => { setHospitalsOpen(false); setLocationOpen(true); }} className="w-full rounded-lg border border-line-soft bg-surface px-4 py-2.5 text-[13px] font-medium">Change location</button></div></section></div>}

      {labReportsOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center"><section className="flex max-h-[min(720px,calc(100vh-32px))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line-soft bg-surface shadow-2xl" aria-label="All laboratory reports"><div className="flex items-start gap-3 border-b border-line-soft p-5"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal"><FileText className="size-5" /></div><div className="min-w-0"><h2 className="font-display text-xl font-medium">Recent lab reports</h2><p className="mt-1 text-[12px] text-ink-soft">Review your latest results and download a PDF for your records.</p></div><button type="button" onClick={() => setLabReportsOpen(false)} className="ml-auto grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-paper" aria-label="Close lab reports"><X className="size-4" /></button></div><div className="overflow-y-auto p-5"><div className="rounded-xl bg-amber-soft p-3 text-[12px] leading-relaxed text-foreground"><strong>Important:</strong> A result marked â€œReviewâ€ or â€œPendingâ€ is not a diagnosis. Your care team should explain what each result means alongside your history and symptoms.</div><div className="mt-4 divide-y divide-line-soft">{labs.length ? labs.map((lab) => <div key={lab.test_name} className="flex flex-wrap items-center gap-3 py-4 first:pt-1"><div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{lab.test_name}</p><p className="mt-1 text-[13px] text-ink-soft">{lab.result_value} {lab.result_unit}</p><p className="mt-1 text-[11px] text-ink-soft">{lab.status === "Normal" ? "Within the reported reference range" : "Discuss this result with your care team"}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${lab.status === "Normal" ? "bg-green-soft text-green" : lab.status === "Review" ? "bg-amber-soft text-amber" : "bg-cobalt-soft text-cobalt"}`}>{lab.status}</span><button type="button" onClick={() => downloadLabReportsPdf([lab])} className="inline-flex items-center gap-1.5 rounded-lg border border-line-soft px-2.5 py-2 text-[12px] font-medium text-ink-soft hover:bg-paper hover:text-foreground" aria-label={`Download ${lab.test_name} report`}><Download className="size-3.5" />PDF</button></div>) : <p className="py-8 text-center text-sm text-ink-soft">No recent lab reports are available.</p>}</div></div><div className="flex flex-wrap justify-end gap-2 border-t border-line-soft bg-paper/50 p-4"><button type="button" onClick={() => setLabReportsOpen(false)} className="rounded-lg border border-line-soft bg-surface px-4 py-2.5 text-[13px] font-medium">Close</button><button type="button" onClick={() => downloadLabReportsPdf(labs)} disabled={!labs.length} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><Download className="size-4" />Download all as PDF</button></div></section></div>}

      <div className="fixed right-5 top-1/2 z-40 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-7">
        {assistantOpen && <section className="flex h-[min(620px,calc(100vh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-line-soft bg-surface shadow-2xl" aria-label="Avatar health assistant">
          <div className="flex items-center gap-3 border-b border-line-soft bg-cobalt p-4 text-primary-foreground"><div className="grid size-10 place-items-center rounded-xl bg-white/15"><Stethoscope className="size-5" /></div><div className="min-w-0"><h2 className="font-display text-lg">Avatar</h2><p className="text-[11px] text-primary-foreground/75">Your health information guide</p></div><button type="button" onClick={() => setAssistantOpen(false)} className="ml-auto grid size-8 place-items-center rounded-lg text-primary-foreground/80 transition hover:bg-white/10 hover:text-primary-foreground" aria-label="Close Avatar"><X className="size-4" /></button></div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-paper/50 p-4" aria-live="polite">{avatarMessages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${message.role === "user" ? "rounded-br-md bg-cobalt text-primary-foreground" : "rounded-bl-md border border-line-soft bg-surface text-foreground"}`}>{message.text}</p></div>)}<div ref={chatEndRef} /></div>
          <div className="border-t border-line-soft bg-surface p-3"><div className="mb-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => setAssistantText("What can cause body pain?")} className="rounded-full border border-line-soft px-2.5 py-1 text-[11px] text-ink-soft transition hover:border-cobalt/40 hover:text-cobalt">Body pain</button><button type="button" onClick={() => setAssistantText("When should I seek help for a fever?")} className="rounded-full border border-line-soft px-2.5 py-1 text-[11px] text-ink-soft transition hover:border-cobalt/40 hover:text-cobalt">Fever</button><button type="button" onClick={() => setAssistantText("Help me understand a disease")} className="rounded-full border border-line-soft px-2.5 py-1 text-[11px] text-ink-soft transition hover:border-cobalt/40 hover:text-cobalt">Conditions</button></div><div className="flex items-end gap-2"><textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); askAvatar(); } }} className="min-h-11 max-h-28 flex-1 resize-none rounded-xl border border-line-soft bg-paper px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-soft/70 focus:border-cobalt/50 focus:ring-2 focus:ring-cobalt/15" placeholder="Ask Avatar about a symptom..." aria-label="Ask Avatar a health question" /><button type="button" onClick={askAvatar} disabled={!assistantText.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-cobalt text-primary-foreground transition hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question to Avatar"><MessageCircle className="size-4" /></button></div><p className="mt-2 text-[10px] leading-snug text-ink-soft"><CircleHelp className="mr-1 inline size-3" />Avatar offers general health information, not diagnosis or emergency care.</p></div>
        </section>}
        <button type="button" onClick={() => setAssistantOpen((open) => !open)} className="group flex items-center gap-2.5 rounded-full bg-cobalt px-3 py-2.5 text-primary-foreground shadow-lg shadow-cobalt/20 transition hover:-translate-y-0.5 hover:bg-cobalt/90" aria-expanded={assistantOpen} aria-controls="avatar-health-assistant"><span className="grid size-10 place-items-center rounded-full bg-white/15"><Stethoscope className="size-5" /></span><span className="pr-1 text-left"><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/70">Ask</span><span className="block font-display text-base leading-none">Avatar</span></span></button>
      </div>
    </div>
  );
}