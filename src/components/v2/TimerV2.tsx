import { useEffect, useRef, useState } from 'react';

const teas = [
	{ id: 'green', name: 'Green', seconds: 120, temp: '80°C' },
	{ id: 'rose', name: 'Rose', seconds: 180, temp: '90°C' },
	{ id: 'saffron', name: 'Saffron', seconds: 210, temp: '95°C' },
	{ id: 'masala', name: 'Masala', seconds: 240, temp: '100°C' },
	{ id: 'black', name: 'Orthodox Black', seconds: 240, temp: '100°C' },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const SIZE = 240;
const R = 108;
const C = 2 * Math.PI * R;

/** Steep timer — "Edition" styling. Same behaviour, hairline dial. */
export default function TimerV2() {
	const [tea, setTea] = useState(teas[0]);
	const [remaining, setRemaining] = useState(teas[0].seconds);
	const [running, setRunning] = useState(false);
	const [done, setDone] = useState(false);
	const raf = useRef<number | null>(null);
	const last = useRef<number | null>(null);

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

	return (
		<div className="timer">
			{/* Dial */}
			<div style={{ display: 'grid', justifyItems: 'center' }}>
				<div className="dial" style={{ width: SIZE, height: SIZE }}>
					{running && (
						<div className="steam" aria-hidden="true">
							{[0, 1, 2].map((i) => (
								<i key={i} style={{ animationDelay: `${i * 0.5}s` }} />
							))}
						</div>
					)}

					<svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
						<circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--line)" strokeWidth="1.5" />
						<circle
							cx={SIZE / 2}
							cy={SIZE / 2}
							r={R}
							fill="none"
							stroke="var(--accent)"
							strokeWidth="3"
							strokeLinecap="round"
							strokeDasharray={C}
							strokeDashoffset={C * (1 - progress)}
							style={{ transition: 'stroke-dashoffset 0.2s linear' }}
						/>
					</svg>

					<div className="dial-face">
						<div>
							<p className="dial-time">{done ? 'Ready' : fmt(Math.ceil(remaining))}</p>
							<p className="dial-note">{done ? 'Pour & enjoy' : `${tea.name} · ${tea.temp}`}</p>
						</div>
					</div>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '2.5rem' }}>
					<button
						className="btn btn-dark"
						onClick={() => {
							if (done) reset();
							setRunning((r) => !r);
						}}
					>
						{running ? 'Pause' : done ? 'Steep again' : remaining < tea.seconds ? 'Resume' : 'Start steeping'}
					</button>
					<button className="icon-btn" onClick={reset} aria-label="Reset timer">
						<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
							<path d="M3 3v5h5" />
						</svg>
					</button>
				</div>
			</div>

			{/* Leaf selector */}
			<div>
				<p className="lede measure-wide" style={{ marginBottom: '2rem' }}>
					Pick your leaf and we'll nail the steep — no bitter cups, no guesswork.
				</p>
				<div className="leaf-list">
					{teas.map((t) => (
						<button key={t.id} className="leaf" data-on={tea.id === t.id ? 'true' : 'false'} onClick={() => pick(t)}>
							<span className="leaf-name">
								<span className="leaf-dot" />
								{t.name} Tea
							</span>
							<span className="leaf-time">
								{fmt(t.seconds)} · {t.temp}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
