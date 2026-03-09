import { useState } from "react";

const INIT = {
  sections: [
    {
      id: "ossa-release",
      title: "1. Release OSSA v0.4.6 to npmjs",
      priority: "critical",
      collapsed: false,
      notes: "",
      tasks: [
        {
          id: "1a",
          text: "Verify ossa-hi API consumes @bluefly/openstandardagents package",
          done: false,
          subtasks: [
            { id: "1a1", text: "Check package.json dependency version in ossa-hi", done: false },
            { id: "1a2", text: "Confirm import paths resolve to openstandardagents", done: false },
            { id: "1a3", text: "Run build - no missing dependency errors", done: false }
          ]
        },
        {
          id: "1b",
          text: "Confirm builds happen in openstandardagent-generator project",
          done: false,
          subtasks: [
            { id: "1b1", text: "Check .gitlab-ci.yml in generator for build pipeline", done: false },
            { id: "1b2", text: "Verify npm publish step targets correct package", done: false },
            { id: "1b3", text: "Test pipeline locally or trigger manual run", done: false }
          ]
        },
        {
          id: "1c",
          text: "Audit openstandardagents.org /agent-builder integration",
          done: false,
          subtasks: [
            { id: "1c1", text: "Verify /agent-builder consumes correct package version", done: false },
            { id: "1c2", text: "Check agent-builder UI renders with latest schema", done: false },
            { id: "1c3", text: "Test agent creation flow end-to-end", done: false }
          ]
        },
        {
          id: "1d",
          text: "Audit GitLab Pages site before publish",
          done: false,
          subtasks: [
            { id: "1d1", text: "Check Pages pipeline status in GitLab", done: false },
            { id: "1d2", text: "Verify site loads at openstandardagents.org", done: false },
            { id: "1d3", text: "Spot-check navigation, links, broken assets", done: false },
            { id: "1d4", text: "Confirm version badge/changelog reflects v0.4.6", done: false }
          ]
        },
        {
          id: "1e",
          text: "Publish v0.4.6 to npm",
          done: false,
          subtasks: [
            { id: "1e1", text: "Final version bump in package.json", done: false },
            { id: "1e2", text: "Run tests one last time", done: false },
            { id: "1e3", text: "Trigger publish pipeline", done: false },
            { id: "1e4", text: "Verify on npmjs.com that v0.4.6 is live", done: false }
          ]
        }
      ]
    },
    {
      id: "ai-agents-ossa",
      title: "2. Audit, clean & release ai_agents_ossa",
      priority: "high",
      collapsed: true,
      notes: "",
      tasks: [
        {
          id: "2a",
          text: "Code audit - module structure and dependencies",
          done: false,
          subtasks: [
            { id: "2a1", text: "Check .info.yml for Drupal 11 compatibility", done: false },
            { id: "2a2", text: "Review service definitions and plugin annotations", done: false },
            { id: "2a3", text: "Verify no deprecated API usage", done: false }
          ]
        },
        {
          id: "2b",
          text: "Clean - dead code, linting, normalize",
          done: false,
          subtasks: [
            { id: "2b1", text: "Run phpcs/phpstan against module", done: false },
            { id: "2b2", text: "Remove unused files and commented-out code", done: false },
            { id: "2b3", text: "Ensure PSR-4 autoloading is correct", done: false }
          ]
        },
        {
          id: "2c",
          text: "Test - verify on DDEV",
          done: false,
          subtasks: [
            { id: "2c1", text: "Enable module on DDEV instance", done: false },
            { id: "2c2", text: "Smoke test core functionality", done: false },
            { id: "2c3", text: "Check for PHP errors in watchdog", done: false }
          ]
        },
        {
          id: "2d",
          text: "Tag and release next version",
          done: false,
          subtasks: [
            { id: "2d1", text: "Bump version in .info.yml", done: false },
            { id: "2d2", text: "Create MR, merge, tag release", done: false }
          ]
        }
      ]
    },
    {
      id: "api-norm",
      title: "3. Audit, clean & release api_normalization",
      priority: "high",
      collapsed: true,
      notes: "",
      tasks: [
        {
          id: "3a",
          text: "Code audit - review api_normalizer module",
          done: false,
          subtasks: [
            { id: "3a1", text: "Check .info.yml and routing.yml", done: false },
            { id: "3a2", text: "Review normalizer/denormalizer classes", done: false },
            { id: "3a3", text: "Verify OpenAPI spec alignment", done: false }
          ]
        },
        {
          id: "3b",
          text: "Clean - dead code, fix structure",
          done: false,
          subtasks: [
            { id: "3b1", text: "Run phpcs/phpstan", done: false },
            { id: "3b2", text: "Remove unused services and files", done: false },
            { id: "3b3", text: "Normalize naming conventions", done: false }
          ]
        },
        {
          id: "3c",
          text: "Test - verify on DDEV",
          done: false,
          subtasks: [
            { id: "3c1", text: "Enable module, check for install errors", done: false },
            { id: "3c2", text: "Test API normalization endpoints", done: false },
            { id: "3c3", text: "Verify response format compliance", done: false }
          ]
        },
        {
          id: "3d",
          text: "Tag and release",
          done: false,
          subtasks: [
            { id: "3d1", text: "Bump version", done: false },
            { id: "3d2", text: "MR, merge, tag", done: false }
          ]
        }
      ]
    },
    {
      id: "extra",
      title: "4. Additional Items",
      priority: "normal",
      collapsed: true,
      notes: "",
      tasks: []
    }
  ]
};

const PC = {
  critical: { bg: "#FF3B30", glow: "rgba(255,59,48,0.25)" },
  high: { bg: "#FF9500", glow: "rgba(255,149,0,0.2)" },
  normal: { bg: "#5856D6", glow: "rgba(88,86,214,0.2)" }
};

function Ring({ progress, size = 36, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (progress / 100) * c;
  const col = progress === 100 ? "#34C759" : progress > 50 ? "#FF9500" : "#5856D6";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2a2e" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease" }} />
    </svg>
  );
}

function cnt(secs) {
  let t = 0, d = 0;
  secs.forEach(s => s.tasks.forEach(tk => {
    if (tk.subtasks.length) tk.subtasks.forEach(st => { t++; if (st.done) d++; });
    else { t++; if (tk.done) d++; }
  }));
  return { t, d };
}

function sp(s) {
  let t = 0, d = 0;
  s.tasks.forEach(tk => {
    if (tk.subtasks.length) tk.subtasks.forEach(st => { t++; if (st.done) d++; });
    else { t++; if (tk.done) d++; }
  });
  return t === 0 ? 0 : Math.round((d / t) * 100);
}

function dn(task) {
  return task.subtasks.length ? task.subtasks.every(s => s.done) : task.done;
}

export default function App() {
  const [data, setData] = useState(INIT);
  const [active, setActive] = useState("ossa-release");
  const [adding, setAdding] = useState(null);
  const [txt, setTxt] = useState("");
  const [editNote, setEditNote] = useState(null);

  const c = cnt(data.sections);
  const tp = c.t === 0 ? 0 : Math.round((c.d / c.t) * 100);
  const focusSec = data.sections.find(s => s.id === active);
  const focusTask = focusSec ? focusSec.tasks.find(t => !dn(t)) : null;
  const focusSub = focusTask ? focusTask.subtasks.find(s => !s.done) : null;

  const tog = (id) => {
    setData(p => ({
      ...p,
      sections: p.sections.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s)
    }));
    setActive(id);
  };

  const chkSub = (sid, tid, stid) => {
    setData(p => ({
      ...p,
      sections: p.sections.map(s => s.id !== sid ? s : {
        ...s,
        tasks: s.tasks.map(t => t.id !== tid ? t : {
          ...t,
          subtasks: t.subtasks.map(st => st.id !== stid ? st : { ...st, done: !st.done })
        })
      })
    }));
  };

  const chkTask = (sid, tid) => {
    setData(p => ({
      ...p,
      sections: p.sections.map(s => s.id !== sid ? s : {
        ...s,
        tasks: s.tasks.map(t => t.id !== tid ? t : { ...t, done: !t.done })
      })
    }));
  };

  const addT = (sid) => {
    if (!txt.trim()) return;
    setData(p => ({
      ...p,
      sections: p.sections.map(s => s.id !== sid ? s : {
        ...s,
        tasks: [...s.tasks, { id: sid + "-" + Date.now(), text: txt.trim(), done: false, subtasks: [] }]
      })
    }));
    setTxt("");
    setAdding(null);
  };

  const setN = (sid, n) => {
    setData(p => ({
      ...p,
      sections: p.sections.map(s => s.id !== sid ? s : { ...s, notes: n })
    }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111114", color: "#e4e4e7", fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <Ring progress={tp} size={48} stroke={4} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#fff", letterSpacing: "-0.02em" }}>FOCUS MODE</h1>
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{tp}% complete - {c.d} of {c.t} tasks</div>
          </div>
        </div>
        {focusTask && (
          <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", border: "1px solid #2a2a4a", borderRadius: 10, padding: "14px 18px", marginTop: 16 }}>
            <div style={{ fontSize: 10, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600 }}>Right now - focus on this:</div>
            <div style={{ fontSize: 14, color: "#e4e4e7", fontWeight: 500, lineHeight: 1.5 }}>{focusTask.text}</div>
            {focusSub && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 6 }}>Next step: {focusSub.text}</div>}
          </div>
        )}
      </div>

      {data.sections.map(sec => {
        const prog = sp(sec);
        const pc = PC[sec.priority];
        const isA = active === sec.id;
        return (
          <div key={sec.id} style={{ marginBottom: 12, borderRadius: 10, border: "1px solid " + (isA ? pc.bg + "55" : "#27272a"), background: isA ? "#1a1a1e" : "#18181b", transition: "all 0.2s", boxShadow: isA ? "0 0 20px " + pc.glow : "none" }}>
            <div onClick={() => tog(sec.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", userSelect: "none" }}>
              <Ring progress={prog} size={32} stroke={3} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{sec.title}</div>
                <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{prog}% - {sec.tasks.filter(dn).length}/{sec.tasks.length} tasks</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: pc.bg + "22", color: pc.bg, textTransform: "uppercase" }}>{sec.priority}</span>
              <span style={{ color: "#71717a", fontSize: 14, transform: sec.collapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 0.2s", display: "inline-block" }}>&#9654;</span>
            </div>

            {!sec.collapsed && (
              <div style={{ padding: "0 16px 16px" }}>
                {editNote === sec.id ? (
                  <textarea
                    value={sec.notes}
                    onChange={e => setN(sec.id, e.target.value)}
                    onBlur={() => setEditNote(null)}
                    autoFocus
                    placeholder="Notes, context, blockers..."
                    style={{ width: "100%", minHeight: 60, background: "#0f0f12", border: "1px solid #3f3f46", borderRadius: 6, color: "#e4e4e7", padding: "8px 10px", fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
                  />
                ) : (
                  <div
                    onClick={() => setEditNote(sec.id)}
                    style={{ fontSize: 11, color: sec.notes ? "#a1a1aa" : "#52525b", cursor: "pointer", padding: "6px 8px", background: "#0f0f12", borderRadius: 6, border: "1px dashed #27272a", minHeight: 28, lineHeight: 1.5, marginBottom: 12 }}
                  >
                    {sec.notes || "Click to add notes..."}
                  </div>
                )}

                {sec.tasks.map(task => {
                  const td = dn(task);
                  return (
                    <div key={task.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", background: td ? "#0f2f1a" : "#0f0f12", borderRadius: 6, border: "1px solid " + (td ? "#166534" : "#27272a") }}>
                        {task.subtasks.length === 0 && (
                          <div
                            onClick={() => chkTask(sec.id, task.id)}
                            style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid " + (task.done ? "#34C759" : "#52525b"), background: task.done ? "#34C759" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}
                          >
                            {task.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>&#10003;</span>}
                          </div>
                        )}
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: td ? "#4ade80" : "#e4e4e7", textDecoration: td ? "line-through" : "none", opacity: td ? 0.7 : 1, lineHeight: 1.5 }}>
                          {task.subtasks.length > 0 && (
                            <span style={{ color: "#71717a", marginRight: 6 }}>
                              [{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}]
                            </span>
                          )}
                          {task.text}
                        </div>
                      </div>
                      {task.subtasks.length > 0 && (
                        <div style={{ marginLeft: 20, marginTop: 4 }}>
                          {task.subtasks.map(st => (
                            <div
                              key={st.id}
                              onClick={() => chkSub(sec.id, task.id, st.id)}
                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", cursor: "pointer", borderRadius: 4 }}
                            >
                              <div style={{ width: 14, height: 14, borderRadius: 3, border: "1.5px solid " + (st.done ? "#34C759" : "#52525b"), background: st.done ? "#34C759" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {st.done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>&#10003;</span>}
                              </div>
                              <span style={{ fontSize: 12, color: st.done ? "#4ade80" : "#a1a1aa", textDecoration: st.done ? "line-through" : "none", opacity: st.done ? 0.6 : 1, lineHeight: 1.4 }}>
                                {st.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {adding === sec.id ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      value={txt}
                      onChange={e => setTxt(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addT(sec.id); }}
                      autoFocus
                      placeholder="New task..."
                      style={{ flex: 1, background: "#0f0f12", border: "1px solid #3f3f46", borderRadius: 6, color: "#e4e4e7", padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none" }}
                    />
                    <button onClick={() => addT(sec.id)} style={{ background: "#5856D6", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Add</button>
                    <button onClick={() => { setAdding(null); setTxt(""); }} style={{ background: "#27272a", color: "#a1a1aa", border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12, cursor: "pointer" }}>X</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdding(sec.id)}
                    style={{ background: "transparent", border: "1px dashed #27272a", borderRadius: 6, color: "#52525b", padding: "8px 12px", fontSize: 12, cursor: "pointer", width: "100%", marginTop: 6, fontFamily: "inherit" }}
                  >
                    + Add task
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 24, padding: "12px 0", borderTop: "1px solid #27272a", fontSize: 11, color: "#52525b", textAlign: "center" }}>
        Click sections to expand - Check items off - Add notes - Purple banner = current focus
      </div>
    </div>
  );
}
