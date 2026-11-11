import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import NewProjectForm from "./components/NewProjectForm.jsx";
import ProjectView from "./components/ProjectView.jsx";
import DebugPanel from "./components/DebugPanel.jsx";
import ErrorNotice from "./components/ErrorNotice.jsx";
import { loadProjects, saveProjects } from "./lib/storage.js";
import { generateArtifact } from "./lib/api.js";
import { buildArtifact } from "./lib/artifacts.js";
import { getProjectItemTexts } from "./lib/checks.js";
import { createId } from "./lib/utils.js";
import { LIMITS } from "../shared/limits.js";

// The failure test panel shows when the URL has ?debug=1
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "1";

// Makes a short project title from the topic or the first line of the notes
const makeProjectTitle = (source) => {
  const firstLine = source.text.trim().split("\n")[0];
  if (firstLine.length <= 50) {
    return firstLine;
  }
  return firstLine.slice(0, 47) + "...";
};

const App = () => {
  const [projects, setProjects] = useState(loadProjects);
  // Opens the most recent project on start, or the new project form if there are none
  const [selectedId, setSelectedId] = useState(projects.length > 0 ? projects[0].id : null);
  // Running or finished-with-a-message generations, keyed by project id
  const [generations, setGenerations] = useState({});
  const [storageError, setStorageError] = useState(null);
  const [debugScenario, setDebugScenario] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // One AbortController per running generation, keyed by project id
  const controllersRef = useRef({});

  // Saves projects whenever they change
  useEffect(() => {
    setStorageError(saveProjects(projects));
  }, [projects]);

  const selectedProject = projects.find((project) => project.id === selectedId) || null;

  // Sets the generation state of one project
  const setGeneration = (projectId, generation) => {
    setGenerations((current) => ({ ...current, [projectId]: generation }));
  };

  // Removes the generation state of one project
  const clearGeneration = (projectId) => {
    setGenerations((current) => {
      const next = { ...current };
      delete next[projectId];
      return next;
    });
  };

  // Opens a project and closes the mobile drawer
  const selectProject = (projectId) => {
    setSelectedId(projectId);
    setSidebarOpen(false);
  };

  // Creates a project from a topic or notes and opens it
  const createProject = (source) => {
    const project = {
      id: createId(),
      title: makeProjectTitle(source),
      createdAt: Date.now(),
      source,
      artifacts: [],
    };
    setProjects((current) => [project, ...current]);
    selectProject(project.id);
  };

  // Deletes a project and stops its running generation, if any
  const deleteProject = (projectId) => {
    cancelGeneration(projectId);
    const remaining = projects.filter((project) => project.id !== projectId);
    setProjects(remaining);
    if (selectedId === projectId) {
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Changes some fields of one artifact, for example its progress
  const updateArtifact = (projectId, artifactId, changes) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        const artifacts = project.artifacts.map((artifact) =>
          artifact.id === artifactId ? { ...artifact, ...changes } : artifact,
        );
        return { ...project, artifacts };
      }),
    );
  };

  // Removes one artifact from a project
  const deleteArtifact = (projectId, artifactId) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        const artifacts = project.artifacts.filter((artifact) => artifact.id !== artifactId);
        return { ...project, artifacts };
      }),
    );
  };

  // Stops a running generation; a cancelled request shows no error
  const cancelGeneration = (projectId) => {
    const controller = controllersRef.current[projectId];
    if (controller) {
      controller.abort();
      delete controllersRef.current[projectId];
    }
    clearGeneration(projectId);
  };

  // Runs one generation and adds the result to the project it was started from
  const startGeneration = async (projectId, options) => {
    const project = projects.find((item) => item.id === projectId);
    // Only one generation per project at a time
    if (!project || controllersRef.current[projectId]) {
      return;
    }

    const controller = new AbortController();
    controllersRef.current[projectId] = controller;
    setGeneration(projectId, { status: "loading", options });

    const request = {
      type: options.type,
      source: project.source,
      count: options.count,
      difficulty: options.difficulty,
      instruction: options.instruction,
      // The most recent questions, so the model writes new ones
      existing: getProjectItemTexts(project).slice(-LIMITS.existingMax),
      // Items to practise again, when "My weak spots" was chosen
      weak: options.weak,
    };

    try {
      const response = await generateArtifact(request, controller.signal, debugScenario);

      // Cancelled or replaced while waiting, so this answer is stale
      if (controllersRef.current[projectId] !== controller) {
        return;
      }
      delete controllersRef.current[projectId];

      if (response.status === "rejected" || response.status === "exhausted") {
        setGeneration(projectId, { status: response.status, options, message: response.reason });
        return;
      }

      const artifact = buildArtifact(project, options, response);
      if (!artifact) {
        setGeneration(projectId, {
          status: "duplicates",
          options,
          message: "Everything the AI made was already in this project. Try a different focus.",
        });
        return;
      }

      // Applied by project id, so switching projects is safe; a deleted project matches nothing
      setProjects((current) =>
        current.map((item) =>
          item.id === projectId ? { ...item, artifacts: [...item.artifacts, artifact] } : item,
        ),
      );
      clearGeneration(projectId);
    } catch (error) {
      if (controllersRef.current[projectId] !== controller) {
        return;
      }
      delete controllersRef.current[projectId];
      setGeneration(projectId, {
        status: "error",
        options,
        message: error.message,
        code: error.code,
        retryable: error.retryable,
      });
    }
  };

  return (
    <div className="flex h-dvh bg-zinc-950 font-sans text-zinc-100 antialiased">
      <Sidebar
        projects={projects}
        selectedId={selectedId}
        generations={generations}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={selectProject}
        onNew={() => selectProject(null)}
        onDelete={deleteProject}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {DEBUG_MODE && <DebugPanel scenario={debugScenario} onChange={setDebugScenario} />}

        {storageError && (
          <div className="px-4 pt-4 md:px-8">
            <ErrorNotice title="Not saved" message={storageError} />
          </div>
        )}

        {selectedProject ? (
          <ProjectView
            key={selectedProject.id}
            project={selectedProject}
            generation={generations[selectedProject.id]}
            onOpenSidebar={() => setSidebarOpen(true)}
            onGenerate={(options) => startGeneration(selectedProject.id, options)}
            onCancel={() => cancelGeneration(selectedProject.id)}
            onDismiss={() => clearGeneration(selectedProject.id)}
            onUpdateArtifact={(artifactId, changes) => updateArtifact(selectedProject.id, artifactId, changes)}
            onDeleteArtifact={(artifactId) => deleteArtifact(selectedProject.id, artifactId)}
          />
        ) : (
          <NewProjectForm
            hasProjects={projects.length > 0}
            onCreate={createProject}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
