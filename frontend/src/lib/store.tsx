"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Analysis, MatchResponse, Project, SavedProject, Standup, Task } from "./types";

interface ProjectStore {
  project: Project | null;
  analysis: Analysis | null;
  matches: MatchResponse | null;
  tasks: Task[];
  standup: Standup | null;
  projects: SavedProject[];
  setProject: (p: Project | null) => void;
  setAnalysis: (a: Analysis | null) => void;
  setMatches: (m: MatchResponse | null) => void;
  setTasks: (tasks: Task[]) => void;
  setStandup: (s: Standup | null) => void;
  setProjects: (projects: SavedProject[]) => void;
  addProject: (project: SavedProject) => void;
}

const Ctx = createContext<ProjectStore | null>(null);

export function ProjectStoreProvider({ children }: { children: ReactNode }) {
  const [project, setProjectState] = useState<Project | null>(null);
  const [analysis, setAnalysisState] = useState<Analysis | null>(null);
  const [matches, setMatchesState] = useState<MatchResponse | null>(null);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [standup, setStandupState] = useState<Standup | null>(null);
  const [projects, setProjectsState] = useState<SavedProject[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ah_state");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.project) setProjectState(parsed.project);
      if (parsed.analysis) setAnalysisState(parsed.analysis);
      if (parsed.matches) setMatchesState(parsed.matches);
      if (parsed.tasks) setTasksState(parsed.tasks);
      if (parsed.standup) setStandupState(parsed.standup);
      if (parsed.projects) setProjectsState(parsed.projects);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const snapshot = { project, analysis, matches, tasks, standup, projects };
    try {
      localStorage.setItem("ah_state", JSON.stringify(snapshot));
    } catch {
      /* storage full or unavailable */
    }
  }, [project, analysis, matches, tasks, standup, projects]);

  const setProject = useCallback((p: Project | null) => setProjectState(p), []);
  const setAnalysis = useCallback((a: Analysis | null) => setAnalysisState(a), []);
  const setMatches = useCallback((m: MatchResponse | null) => setMatchesState(m), []);
  const setTasks = useCallback((t: Task[]) => setTasksState(t), []);
  const setStandup = useCallback((s: Standup | null) => setStandupState(s), []);
  const setProjects = useCallback((p: SavedProject[]) => setProjectsState(p), []);
  const addProject = useCallback(
    (p: SavedProject) => setProjectsState((prev) => [...prev, p]),
    [],
  );

  return (
    <Ctx.Provider
      value={{
        project,
        analysis,
        matches,
        tasks,
        standup,
        projects,
        setProject,
        setAnalysis,
        setMatches,
        setTasks,
        setStandup,
        setProjects,
        addProject,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useProjectStore(): ProjectStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProjectStore must be used inside ProjectStoreProvider");
  return ctx;
}
