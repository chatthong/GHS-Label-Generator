import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get("cid");

  if (!cid) {
    return new Response(JSON.stringify({ error: "CID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const basicResponse = await axios.get(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`
    );
    const compoundData = basicResponse.data.PropertyTable.Properties[0];

    const detailsResponse = await axios.get(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON`
    );
    const detailsData = detailsResponse.data;

    const synonymResponse = await axios.get(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`
    );
    const synonyms =
      synonymResponse.data.InformationList.Information[0].Synonym;

    // Extract relevant information from details data
    const topLevelInfo = extractTopLevelInfo(detailsData);
    const casNumber = extractCASNumber(detailsData);
    const hazardInformation = extractGHSSymbols(detailsData);
    const hazardsSummary = extractHazardsSummary(detailsData);
    const firstAidMeasures = extractFirstAidMeasures(detailsData);
    const ghsInfo = extractGHSInfo(detailsData);
    const physicalDangers = extractPhysicalDangers(detailsData);
    const nfpaDiamonds = extractNFPADiamonds(detailsData);

    const commonName = synonyms[0] || compoundData.IUPACName;

    return new Response(
      JSON.stringify({
        ...compoundData,
        commonName,
        casNumber,
        hazardInformation,
        hazardsSummary,
        firstAidMeasures,
        ghsInfo,
        topLevelInfo,
        physicalDangers,
        nfpaDiamonds, // Add NFPA 704 Diamond URLs to response
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching data from PubChem:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching data from PubChem" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function extractNFPADiamonds(detailsData) {
  const diamonds = [];

  // Locate "Safety and Hazards" section
  const safetyAndHazardsSection = detailsData?.Record?.Section?.find(
    (section) => section.TOCHeading === "Safety and Hazards"
  );

  if (!safetyAndHazardsSection) return diamonds;

  // Find "NFPA Hazard Classification" within "Safety and Hazards"
  const nfpaSection = safetyAndHazardsSection.Section?.find(
    (subSection) => subSection.TOCHeading === "NFPA Hazard Classification"
  );

  if (!nfpaSection?.Information) return diamonds;

  // Extract "NFPA 704 Diamond" URLs
  nfpaSection.Information.forEach((info) => {
    if (info.Name === "NFPA 704 Diamond" && info.Value?.StringWithMarkup) {
      info.Value.StringWithMarkup.forEach((item) => {
        const icon = item?.Markup?.find((markup) => markup.Type === "Icon");
        console.log(icon);
        if (icon?.URL) {
          diamonds.push({
            url: icon.URL,
            description: icon.Extra || "NFPA 704 Diamond Icon",
          });
        }
      });
    }
  });

  return diamonds;
}

// Function to extract top-level information
function extractTopLevelInfo(detailsData) {
  if (!detailsData?.Record) {
    return { recordType: null, recordNumber: null, recordTitle: null };
  }

  return {
    recordType: detailsData.Record.RecordType,
    recordNumber: detailsData.Record.RecordNumber,
    recordTitle: detailsData.Record.RecordTitle,
  };
}

function extractCASNumber(detailsData) {
  const casSection =
    detailsData?.Record?.Section?.[2]?.Section?.[3]?.Section?.[0];

  if (casSection?.TOCHeading === "CAS") {
    const informationArray = casSection.Information || [];

    for (const info of informationArray) {
      if (info.Value && info.Value.StringWithMarkup) {
        return info.Value.StringWithMarkup[0].String;
      }
    }
  }

  return null;
}

function extractGHSSymbols(detailsData) {
  const symbols = [];
  const chemicalSafetySection = detailsData?.Record?.Section?.find(
    (section) => section.TOCHeading === "Chemical Safety"
  );

  if (chemicalSafetySection?.Information) {
    chemicalSafetySection.Information.forEach((info) => {
      const stringWithMarkup = info.Value?.StringWithMarkup || [];

      stringWithMarkup.forEach((item) => {
        const markups = item.Markup || [];

        markups.forEach((markup) => {
          if (markup.Type === "Icon" && markup.URL) {
            symbols.push({
              url: markup.URL,
              description: markup.Extra || "GHS Symbol",
            });
          }
        });
      });
    });
  }

  return symbols;
}

function extractHazardsSummary(detailsData) {
  const namesAndIdentifiersSection = detailsData?.Record?.Section?.find(
    (section) => section.TOCHeading === "Names and Identifiers"
  );

  if (namesAndIdentifiersSection) {
    const recordDescriptionSection = namesAndIdentifiersSection.Section?.find(
      (subSection) => subSection.TOCHeading === "Record Description"
    );

    if (recordDescriptionSection) {
      const hazardsSummaryInfo = recordDescriptionSection.Information?.find(
        (info) => info.Description === "Hazards Summary"
      );

      if (hazardsSummaryInfo?.Value?.StringWithMarkup) {
        return hazardsSummaryInfo.Value.StringWithMarkup[0].String;
      }
    }
  }

  return null;
}

function extractFirstAidMeasures(detailsData) {
  const firstAidMeasures = [];

  const safetyAndHazardsSection = detailsData?.Record?.Section?.find(
    (section) => section.TOCHeading === "Safety and Hazards"
  );

  const firstAidSection = safetyAndHazardsSection?.Section?.find(
    (subSection) => subSection.TOCHeading === "First Aid Measures"
  );

  if (firstAidSection?.Information) {
    firstAidSection.Information.forEach((info) => {
      if (info.Name && info.Value?.StringWithMarkup) {
        firstAidMeasures.push({
          type: info.Name,
          instruction: info.Value.StringWithMarkup[0].String,
        });
      }
    });
  }

  return firstAidMeasures;
}

function extractGHSInfo(detailsData) {
  const ghsInfo = {
    signalWord: null,
    hazardStatements: [],
  };

  const safetyAndHazardsSection = detailsData?.Record?.Section?.find(
    (section) => section.TOCHeading === "Safety and Hazards"
  );

  if (safetyAndHazardsSection) {
    const hazardsIdentificationSection = safetyAndHazardsSection.Section?.find(
      (subSection) => subSection.TOCHeading === "Hazards Identification"
    );

    if (hazardsIdentificationSection) {
      const ghsClassificationSection =
        hazardsIdentificationSection.Section?.find(
          (subSubSection) => subSubSection.TOCHeading === "GHS Classification"
        );

      if (ghsClassificationSection?.Information) {
        ghsClassificationSection.Information.forEach((info) => {
          if (info.Name === "Signal" && info.Value?.StringWithMarkup) {
            ghsInfo.signalWord = info.Value.StringWithMarkup[0].String;
          }

          if (
            info.Name === "GHS Hazard Statements" &&
            info.Value?.StringWithMarkup
          ) {
            info.Value.StringWithMarkup.forEach((statement) => {
              if (/\d+(\.\d+)?%/.test(statement.String)) {
                ghsInfo.hazardStatements.push(statement.String);
              }
            });
          }
        });
      }
    }
  }

  return ghsInfo;
}

// Function to extract Physical Dangers
function extractPhysicalDangers(detailsData) {
  const safetyAndHazardsSection = detailsData?.Record?.Section?.find(
    (section) => section.TOCHeading === "Safety and Hazards"
  );

  if (safetyAndHazardsSection) {
    const safetyAndHazardPropertiesSection =
      safetyAndHazardsSection.Section?.find(
        (subSection) => subSection.TOCHeading === "Safety and Hazard Properties"
      );

    if (safetyAndHazardPropertiesSection) {
      const physicalDangersSection =
        safetyAndHazardPropertiesSection.Section?.find(
          (subSubSection) => subSubSection.TOCHeading === "Physical Dangers"
        );

      if (physicalDangersSection?.Information) {
        return physicalDangersSection.Information.map((info) => {
          return info.Value?.StringWithMarkup?.[0]?.String || null;
        }).filter(Boolean);
      }
    }
  }

  return null;
}
