const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "run_api_server.js");
let content = fs.readFileSync(file, "utf8");

const oldRequires = "const { documentToSessions } = require(\x27./services/document-to-sessions\x27);";
const newRequires = oldRequires + "\nconst { planDocument } = require(\x27./services/scene-planner\x27);\nconst { buildMultiSceneMovie } = require(\x27./services/multi-scene-builder\x27);";
if (content.split(oldRequires).length !== 2) throw new Error("requires anchor not unique: " + content.split(oldRequires).length);
content = content.replace(oldRequires, newRequires);

const oldRoute = `      if (!parsed || !parsed.fullText) return sendJson(res, 400, { success: false, error: \x27Unable to parse uploaded document\x27 });

      const sessionPayload = await documentToSessions(parsed);
      if (!sessionPayload || !Array.isArray(sessionPayload.sessions) || !sessionPayload.sessions.length) {
        return sendJson(res, 400, { success: false, error: \x27Failed to generate scenes from document\x27 });
      }

      const movie = buildJson2VideoMovie(sessionPayload.sessions, { projectName: \`Document Render - \${filename}\` });
      const renderResult = await renderMovie(movie, { projectName: \`Document Render - \${filename}\` });

      const project = (renderResult && renderResult.body && (renderResult.body.project || renderResult.body.projectId)) || renderResult.project || renderResult.projectId || renderResult.renderId || null;

      return sendJson(res, 200, { success: true, status: renderResult.status, project: project, videoUrl: renderResult.videoUrl, url: renderResult.videoUrl, jobId: renderResult.jobId, renderId: renderResult.renderId, fallback: !!renderResult.fallback, message: renderResult.message || renderResult.error || \x27Render submitted\x27, movie, sessions: sessionPayload.sessions });`;

if (content.split(oldRoute).length !== 2) throw new Error("route anchor not unique: " + content.split(oldRoute).length);

const newRoute = `      if (!parsed || !parsed.fullText) return sendJson(res, 400, { success: false, error: \x27Unable to parse uploaded document\x27 });

      const diagnostics = {
        documentType: path.extname(filename).toLowerCase().replace(\x27.\x27, \x27\x27) || \x27unknown\x27,
        pages: parsed.pageCount || (parsed.pages ? parsed.pages.length : 0),
        scenesGenerated: 0,
        scenePlan: \x27FAIL\x27,
        movieJson: \x27FAIL\x27,
        schemaValidation: \x27FAIL\x27,
        fallbackUsed: false,
      };

      let movie = null;
      let scenesUsed = null;
      try {
        const plan = await planDocument(parsed);
        if (!plan || !plan.success || !Array.isArray(plan.scenes) || !plan.scenes.length) {
          throw new Error((plan && plan.error) || \x27Scene planning produced no scenes\x27);
        }
        diagnostics.scenePlan = \x27PASS\x27;
        diagnostics.scenesGenerated = plan.scenes.length;
        const buildResult = await buildMultiSceneMovie(plan.scenes, { name: \`Document Render - \${filename}\` });
        if (!buildResult || !buildResult.success || !buildResult.movie) {
          throw new Error(\x27Multi-scene movie build failed\x27);
        }
        diagnostics.movieJson = \x27PASS\x27;
        normalizeAndValidate(JSON.stringify(buildResult.movie));
        diagnostics.schemaValidation = \x27PASS\x27;
        movie = buildResult.movie;
        scenesUsed = plan.scenes;
      } catch (scenePlanErr) {
        console.error(\x27[local-api] scene planning failed, falling back to legacy one-scene pipeline:\x27, scenePlanErr.message);
        diagnostics.fallbackUsed = true;
        try {
          const sessionPayload = await documentToSessions(parsed);
          if (!sessionPayload || !Array.isArray(sessionPayload.sessions) || !sessionPayload.sessions.length) {
            throw new Error(\x27Failed to generate scenes from document (fallback)\x27);
          }
          movie = buildJson2VideoMovie(sessionPayload.sessions, { projectName: \`Document Render - \${filename}\` });
          diagnostics.movieJson = \x27PASS\x27;
          normalizeAndValidate(JSON.stringify(movie));
          diagnostics.schemaValidation = \x27PASS\x27;
          diagnostics.scenesGenerated = sessionPayload.sessions.length;
          scenesUsed = sessionPayload.sessions;
        } catch (fallbackErr) {
          console.error(\x27[local-api] fallback pipeline also failed:\x27, fallbackErr.message);
          console.log(\x27[integration-diagnostics]\x27, JSON.stringify(diagnostics));
          return sendJson(res, 400, { success: false, error: fallbackErr.message || \x27Failed to generate scenes from document\x27, diagnostics });
        }
      }

      console.log(\x27[integration-diagnostics]\x27, JSON.stringify(diagnostics));
      return sendJson(res, 200, { success: true, movie, scenes: scenesUsed, diagnostics });`;

content = content.replace(oldRoute, newRoute);
fs.writeFileSync(file, content, "utf8");
console.log("DONE");

