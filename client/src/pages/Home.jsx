import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { formatEther } from "viem";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowUpDown, BadgeCheck, BarChart3, Heart,
  Search, Sparkles, ShieldCheck, Wallet, Plus, X, TrendingUp,
} from "lucide-react";
import { useStateContext } from "../context";
import FundCard from "../components/FundCard";
import heroImage from "../assets/HeroImg.jpg";

const filters = ["all", "active", "successful", "closed", "ended", "mine"];

const eth = (value) => {
  try {
    return Number(formatEther(BigInt(value || 0))).toLocaleString("en-US", {
      maximumFractionDigits: 4,
    });
  } catch {
    return "0";
  }
};

const status = (c) => {
  const campaignStatus = Number(c.status);
  const deadline = Number(c.deadline || 0);
  const now = Math.floor(Date.now() / 1000);

  if (campaignStatus === 1) return "successful";
  if (campaignStatus === 2) return "closed";
  if (campaignStatus === 3) return "ended";

  if (deadline > 0 && now >= deadline) {
    return Number(c.amountCollected) >= Number(c.target)
      ? "successful"
      : "ended";
  }

  return "active";
};

const address = (value) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Unknown";

const progress = (c) => {
  const target = Number(eth(c.target));
  return target > 0
    ? Math.min((Number(eth(c.amountCollected)) / target) * 100, 100)
    : 0;
};

const Home = () => {
  const { getCampaigns, getDonations, contract } = useStateContext();
  const account = useActiveAccount();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const data = (await getCampaigns()) || [];
        if (cancelled) return;
        setCampaigns(data);

        const results = await Promise.all(
          data.map(async (c) => {
            try {
              const items = await getDonations(c.pId);
              return (items || []).map((d, i) => ({
                ...d, amount: Number(d.donation).toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                }),
                key: `${c.pId}-${i}-${d.donator}`,
              }));
            } catch {
              return [];
            }
          })
        );

        if (!cancelled) setDonations(results.flat().reverse());
      } catch (error) {
        console.error("Failed to load campaigns:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [contract, getCampaigns, getDonations]);

  const stats = useMemo(() => [
    {
      label: "Total Raised",
      value: `${campaigns.reduce((sum, c) => sum + Number(eth(c.amountCollected)), 0).toLocaleString("en-US", { maximumFractionDigits: 4 })} ETH`,
      icon: TrendingUp,
      color: "emerald",
    },
    {
      label: "Active Campaigns",
      value: campaigns.filter((c) => status(c) === "active").length,
      icon: BarChart3,
      color: "blue",
    },
    {
      label: "Successful",
      value: campaigns.filter((c) => status(c) === "successful").length,
      icon: BadgeCheck,
      color: "violet",
    },
    {
      label: "Total Donations",
      value: donations.length,
      icon: Heart,
      color: "rose",
    },
  ], [campaigns, donations]);

  const categories = useMemo(
    () => [...new Set(campaigns.map((c) => c.category).filter(Boolean))],
    [campaigns]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return campaigns.filter((c) =>
      (filter === "all" || status(c) === filter ||
        (filter === "mine" &&
          account?.address?.toLowerCase() === c.owner?.toLowerCase())) &&
      [c.title, c.description, c.category].some((v) =>
        String(v || "").toLowerCase().includes(query)
      ) &&
      (category === "all" || c.category === category)
    ).sort((a, b) => {
      if (sort === "funding") return progress(b) - progress(a);
      if (sort === "target") return Number(eth(b.target)) - Number(eth(a.target));
      if (sort === "deadline") return Number(a.deadline || 0) - Number(b.deadline || 0);
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  }, [campaigns, filter, search, category, sort, account?.address]);

  const openCampaign = (c) =>
    navigate(`/campaign-details/${c.pId}`, { state: c });

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-6 text-slate-900 dark:bg-[#0b0f12] dark:text-white sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -top-40 left-0 h-96 w-96 rounded-full bg-emerald-300/20 blur-[120px]" />

      <div className="relative mx-auto max-w-[1600px] space-y-10">

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-[#11191a] sm:p-10 lg:p-12"
        >
          {/* Background Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-300/25 blur-[100px]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">

            {/* Left Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                ✨ Ideas grow when we support each other
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Great ideas deserve{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  a chance to grow.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 dark:text-slate-400 sm:text-lg">
                Discover meaningful campaigns, support ambitious ideas,
                and help creators turn their goals into reality through
                decentralized crowdfunding.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    document.getElementById("campaigns")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-1 hover:bg-emerald-600"
                >
                  Explore Campaigns →
                </button>

                <button
                  onClick={() => navigate("/create-campaign")}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold transition hover:border-emerald-400 dark:border-white/10"
                >
                  + Start a Campaign
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-500 dark:text-slate-400">
                <span>🛡️ Blockchain-powered</span>
                <span>💚 Wallet-connected</span>
              </div>
            </div>

            {/* Animated Illustration */}
            <div className="relative mx-auto flex h-[300px] w-full max-w-[380px] items-center justify-center sm:h-[360px]">

              {/* Outer Rotating Shape */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 24,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute h-[270px] w-[270px] rounded-[55px] border-2 border-emerald-400/40 sm:h-[320px] sm:w-[320px]"
              />

              {/* Inner Rotating Shape */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute h-[220px] w-[220px] rounded-[45px] border-2 border-teal-400/50 sm:h-[260px] sm:w-[260px]"
              />

              {/* Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.55, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl"
              />

              {/* Main Image */}
              <motion.img
                src={heroImage}
                alt="Illustration representing community crowdfunding"
                animate={{ y: [0, -12, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 h-52 w-52 object-contain drop-shadow-xl sm:h-64 sm:w-64"
              />

              {/* Floating Donation Badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-0 top-10 z-20 rounded-2xl border border-emerald-100 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-[#18211f] sm:left-[-10px]"
              >
                <span className="text-sm"> Support Ideas<span className="text-lg"> 💚</span></span>
              </motion.div>

              {/* Floating Community Badge */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-8 right-0 z-20 rounded-2xl border border-emerald-100 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-[#18211f] sm:right-[-10px]"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Together we can
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Make an Impact ✨
                </p>
              </motion.div>

            </div>
          </div>
        </motion.section>

        {/* Statistics */}
        <section>
          <h2 className="mb-5 text-2xl font-bold">Platform Overview</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11191a]"
              >
                <div className={`rounded-xl bg-${color}-100 p-3 text-${color}-600 dark:bg-white/5`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-xl font-bold">{loading ? "..." : value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Campaign discovery */}
        <section id="campaigns" className="scroll-mt-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Discover</p>
            <h2 className="mt-2 text-3xl font-bold">Explore Campaigns</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Find a cause you care about and make a difference.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">


              {/* Status filters */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium capitalize transition ${filter === f
                      ? "bg-emerald-500 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      }`}
                  >
                    {f === "mine" ? "My Campaigns" : f === "all" ? "All Campaigns" : f}
                  </button>
                ))}
              </div>

              {/* Category filters */}
              {categories.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {["all", ...categories].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${category === c
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                        }`}
                    >
                      {c === "all" ? "All categories" : c}
                    </button>
                  ))}
                </div>
              )}

              {/* Campaign cards */}
              {loading ? (
                <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 2xl:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
                  ))}
                </div>
              ) : filtered.length ? (
                <div className="grid grid-cols-1 justify-items-center gap-12 sm:grid-cols-2 2xl:grid-cols-3">
                  {filtered.map((c, i) => (
                    <motion.div
                      key={c.pId ?? i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.06, 0.3) }}
                      whileHover={{ y: -4 }}
                      className="w-full min-w-0 max-w-[420px]"
                    >
                      <FundCard {...c} handleClick={() => openCampaign(c)} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/10 dark:bg-[#11191a]">
                  <Search size={28} className="mx-auto text-slate-400" />
                  <h3 className="mt-4 font-bold">No campaigns found</h3>
                  <p className="mt-2 text-sm text-slate-500">Try changing your search or filters.</p>
                  <button
                    onClick={() => { setFilter("all"); setSearch(""); setCategory("all"); setSort("newest"); }}
                    className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Recent donations */}
            <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11191a]">
              <div className="border-b border-slate-100 p-5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Heart size={19} className="text-emerald-500" />
                  <h3 className="font-bold">Recent Donations</h3>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Latest campaign contributions
                </p>
              </div>

              <div className="space-y-1 p-3">
                {loading ? (
                  [1, 2, 3].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />)
                ) : donations.length ? (
                  donations.slice(0, 6).map((d, i) => (
                    <div key={d.key || i} className="flex items-center gap-3 rounded-xl p-3 hover:bg-emerald-50 dark:hover:bg-emerald-500/5">
                      <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Wallet size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{address(d.donator)}</p>
                        <p className="mt-1 text-xs text-slate-500">Contribution</p>
                      </div>
                      <p className="shrink-0 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{d.amount} ETH
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">No donations yet.</p>
                )}
              </div>

              <div className="border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                <ShieldCheck size={15} className="mr-2 inline text-emerald-500" />
                Blockchain-powered contributions
              </div>

              <div className="m-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
                <Sparkles size={22} />
                <h3 className="mt-3 text-lg font-bold">Have an idea?</h3>
                <p className="mt-2 text-sm text-white/85">Create a campaign and invite the community to support your goal.</p>
                <button
                  onClick={() => navigate("/create-campaign")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700"
                >
                  Create Campaign <ArrowRight size={16} />
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;