import { useEffect, useRef, useState } from 'react';

const teas = [
	{ id: 'green', name: 'Green', seconds: 120, temp: '80°C', color: '#3f7d54' },
	{ id: 'rose', name: 'Rose', seconds: 180, temp: '90°C', color: '#e0669a' },
	{ id: 'saffron', name: 'Saffron', seconds: 210, temp: '95°C', color: '#e7a33a' },
	{ id: 'masala', name: 'Masala', seconds: 240, temp: '100°C', color: '#b0562b' },
	{ id: 'black', name: 'Orthodox Black', seconds: 240, temp: '100°C', color: '#4a2c1a' },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function SteepTimer() {
	const [tea, setTea] = useState(teas[0]);
	const [remaining, setRemaining] = useState(teas[0].seconds);
	const [running, setRunning] = useState(false);
	const [done, setDone] = useState(false);
	const raf = useRef<number | null>(null);
	const last = useRef<number | null>(null);

	// Countdown loop
	useEffect(() => {
		if (!running) return;
		const tick = (t: number) => {
			if (last.current === null) last.current = t;
			const dt = (t - last.current) / 1000;
			last.current = t;
			setRemaining((r) => {
				const next = r - dt;
				if (next <= 0) {
					setRunning(false);
					setDone(true);
					return 0;
				}
				return next;
			});
			raf.current = requestAnimationFrame(tick);
		};
		raf.current = requestAnimationFrame(tick);
		return () => {
			if (raf.current) cancelAnimationFrame(raf.current);
			last.current = null;
		};
	}, [running]);

	const pick = (t: (typeof teas)[number]) => {
		setTea(t);
		setRemaining(t.seconds);
		setRunning(false);
		setDone(false);
	};
	const reset = () => {
		setRemaining(tea.seconds);
		setRunning(false);
		setDone(false);
	};

	const progress = 1 - remaining / tea.seconds;
	const R = 86;
	const C = 2 * Math.PI * R;

	return (
		<div className="grid gap-10 lg:grid-cols-2 lg:items-center">
			{/* Timer dial */}
			<div className="flex flex-col items-center">
				<div className="relative">
					{/* Steam */}
					<div className="absolute -top-8 left-1/2 flex -translate-x-1/2 gap-3" aria-hidden="true">
						{running &&
							[0, 1, 2].map((i) => (
								<span
									key={i}
									className="animate-steam block h-8 w-1.5 rounded-full bg-white/50"
									style={{ animationDelay: `${i * 0.5}s` }}
								/>
							))}
					</div>

					<svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
						<circle cx="110" cy="110" r={R} fill="none" stroke="rgba(16,36,26,0.10)" strokeWidth="14" />
						<circle
							cx="110"
							cy="110"
							r={R}
							fill="none"
							stroke={tea.color}
							strokeWidth="14"
							strokeLinecap="round"
							strokeDasharray={C}
							strokeDashoffset={C * (1 - progress)}
							style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.4s ease' }}
						/>
					</svg>

					<div className="absolute inset-0 grid place-items-center">
						<div className="text-center">
							<div className="text-5xl font-bold tabular-nums">
								{done ? (
									<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" aria-hidden="true">
										<path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
										<path d="M6 2v2M10 2v2M14 2v2" />
									</svg>
								) : (
									fmt(Math.ceil(remaining))
								)}
							</div>
							<p className="mt-1 text-sm font-medium text-ink/60">
								{done ? 'Pour & enjoy' : `${tea.name} · ${tea.temp}`}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-8 flex items-center gap-3">
					<button
						onClick={() => {
							if (done) reset();
							setRunning((r) => !r);
						}}
						className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-brand active:scale-95"
					>
						{running ? 'Pause' : done ? 'Steep again' : remaining < tea.seconds ? 'Resume' : 'Start steeping'}
					</button>
					<button
						onClick={reset}
						aria-label="Reset timer"
						className="grid h-12 w-12 place-items-center rounded-full border border-ink/15 transition hover:border-ink/40 hover:rotate-180"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
						</svg>
					</button>
				</div>
			</div>

			{/* Tea selector */}
			<div>
				<p className="text-ink/70">Pick your leaf and we'll nail the steep — no bitter cups, no guesswork.</p>
				<div className="mt-5 space-y-2.5">
					{teas.map((t) => (
						<button
							key={t.id}
							onClick={() => pick(t)}
							className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition duration-300 ${
								tea.id === t.id
									? 'border-ink bg-paper shadow-md'
									: 'border-ink/10 bg-transparent hover:border-ink/30 hover:bg-paper/60'
							}`}
						>
							<span className="flex items-center gap-3 font-semibold">
								<span className="h-3.5 w-3.5 rounded-full" style={{ background: t.color }} />
								{t.name} Tea
							</span>
							<span className="text-sm text-ink/55 tabular-nums">
								{fmt(t.seconds)} · {t.temp}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
