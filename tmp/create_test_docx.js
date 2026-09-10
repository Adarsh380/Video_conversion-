const JSZip = require("jszip");
const fs = require("fs");

const sections = [
  { heading: "Introduction to Renewable Energy", body: "Renewable energy comes from natural sources that replenish themselves. Solar, wind, and hydro power are leading examples. This document explores their growth, benefits, and challenges across the globe." },
  { heading: "Solar Power Overview", body: "Solar power harnesses sunlight using photovoltaic cells. Costs have dropped dramatically over the last decade, making it one of the cheapest sources of new electricity generation in many regions." },
  { heading: "Wind Energy Fundamentals", body: "Wind turbines convert kinetic energy from moving air into electricity. Offshore wind farms are increasingly common because of stronger and more consistent wind speeds at sea." },
  { heading: "Hydroelectric Power", body: "Hydroelectric dams use flowing water to spin turbines. It remains the largest source of renewable electricity worldwide, though new large dam construction has slowed due to environmental concerns." },
  { heading: "Energy Storage Solutions", body: "Battery storage systems help balance supply and demand from intermittent renewable sources. Lithium-ion batteries dominate the market, but new chemistries are emerging to reduce costs further." },
  { heading: "Grid Modernization", body: "Modern electrical grids need to accommodate distributed generation and variable renewable output. Smart grid technology enables better forecasting, demand response, and integration of storage." },
  { heading: "Policy and Incentives", body: "Governments use tax credits, subsidies, and renewable portfolio standards to accelerate adoption. Policy stability is often cited as the single biggest factor in renewable investment decisions." },
  { heading: "Economic Impact", body: "The renewable energy sector has created millions of jobs worldwide in manufacturing, installation, and maintenance. Regions transitioning from fossil fuels face both opportunities and workforce challenges." },
  { heading: "Environmental Benefits", body: "Renewable energy sources produce little to no greenhouse gas emissions during operation, helping to reduce the impacts of climate change and improve local air quality." },
  { heading: "Future Outlook", body: "Continued innovation in materials, storage, and grid integration is expected to drive renewable energy costs down further, making a fully renewable grid increasingly feasible within coming decades." },
];

function esc(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let bodyXml = "";
for (const s of sections) {
  bodyXml += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(s.heading)}</w:t></w:r></w:p>`;
  bodyXml += `<w:p><w:r><w:t xml:space="preserve">${esc(s.body)}</w:t></w:r></w:p>`;
}

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr/>
  </w:body>
</w:document>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const zip = new JSZip();
zip.file("[Content_Types].xml", contentTypesXml);
zip.folder("_rels").file(".rels", rootRelsXml);
zip.folder("word").file("document.xml", documentXml);

zip.generateAsync({ type: "nodebuffer" }).then((buf) => {
  fs.writeFileSync("tmp/renewable_energy_test.docx", buf);
  console.log("DOCX_CREATED:", buf.length, "bytes");
});