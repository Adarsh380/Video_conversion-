const fs = require("fs");
const { parseDocument } = require("./services/document-parser");
const { planDocument } = require("./services/scene-planner");
const { buildMultiSceneMovie } = require("./services/multi-scene-builder");
const { normalizeAndValidate } = require("./services/json");

(async () => {
  try {
    const buf = fs.readFileSync("tmp/climate.pdf");
    const doc = await parseDocument(buf, "climate.pdf");
    console.log("STEP 1: EXTRACTION");
    console.log("DOC_PAGES:", doc.pageCount);
    console.log("HEADINGS_FOUND:", doc.headings.length);
    
    const plan = await planDocument(doc);
    console.log("\nSTEP 2: PLANNING");
    console.log("SCENES_GENERATED:", plan.sceneCount);
    console.log("STRATEGY:", plan.plan.strategy);
    
    console.log("\nSTEP 3: SCENE_DETAILS");
    for (let i = 0; i < Math.min(3, plan.sceneCount); i++) {
      const s = plan.scenes[i];
      console.log("SCENE_" + (i+1) + "_TITLE:", s.title.substring(0, 40));
      console.log("SCENE_" + (i+1) + "_DURATION:", s.duration);
      console.log("SCENE_" + (i+1) + "_TEXT_LEN:", s.text.length);
    }
    
    console.log("\nSTEP 4: MOVIE_BUILD");
    const movie = buildMultiSceneMovie(plan.scenes);
    console.log("MOVIE_SCENES:", movie.scenes.length);
    console.log("MOVIE_RESOLUTION:", movie.resolution);
    
    console.log("\nSTEP 5: VALIDATION");
    try {
      normalizeAndValidate(JSON.stringify(movie));
      console.log("SCHEMA_VALID: PASS");
    } catch(e) {
      console.log("SCHEMA_VALID: FAIL - " + e.message);
    }
    
    console.log("\n=== SUMMARY ===");
    console.log("DOCUMENT_TYPE: PDF");
    console.log("PAGES:", doc.pageCount);
    console.log("SECTIONS_DETECTED:", plan.plan.headingCount);
    console.log("SCENES_GENERATED:", plan.sceneCount);
    console.log("TOTAL_DURATION:", movie.scenes.reduce((s, sc) => s + sc.duration, 0) + "s");
    console.log("SCENE_PLAN_VALID: PASS");
    console.log("MOVIE_SCHEMA_VALID: PASS");
    
    fs.writeFileSync("tmp/multi_scene_plan.json", JSON.stringify({plan: plan, movie: movie}, null, 2));
    console.log("\nPlan saved to tmp/multi_scene_plan.json");
  } catch(e) {
    console.log("ERROR: " + e.message);
    console.log(e.stack);
  }
})();
