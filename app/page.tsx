"use client";

import { useState } from "react";
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Chip,
  Kbd,
  CardFooter,
  ButtonGroup,
} from "@nextui-org/react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { SearchIcon, Download } from "@/components/icons";

interface HazardInfo {
  url: string;
  description: string;
}

interface FirstAidMeasure {
  type: string;
  instruction: string;
}

interface GHSInfo {
  signalWord: string | null;
  hazardStatements: string[];
}

interface TopLevelInfo {
  recordType: string;
  recordNumber: number;
  recordTitle: string;
}

interface CompoundData {
  IUPACName: string;
  MolecularFormula: string;
  MolecularWeight: number;
  CanonicalSMILES: string;
  commonName?: string;
  casNumber?: string;
  hazardInformation?: HazardInfo[];
  hazardsSummary?: string;
  firstAidMeasures?: FirstAidMeasure[];
  ghsInfo?: GHSInfo;
  topLevelInfo?: TopLevelInfo;
  physicalDangers?: string[];
}

type FieldKeys = "manufacturer" | "address" | "mfg" | "size" | "note";

interface Fields {
  manufacturer: string;
  address: string;
  mfg: string;
  size: string;
  note: string;
}

export default function DocsPage() {
  const [cid, setCid] = useState<string>("");
  const [compoundData, setCompoundData] = useState<CompoundData | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Track loading state

  const [fields, setFields] = useState<Fields>({
    manufacturer: "-",
    address: "-",
    mfg: "-/-/-",
    size: "-",
    note: "-",
  });

  const [editing, setEditing] = useState<Record<FieldKeys, boolean>>({
    manufacturer: false,
    address: false,
    mfg: false,
    size: false,
    note: false,
  });

  const handleToggleEdit = (field: FieldKeys) => {
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field: FieldKeys, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const fetchCompoundData = async () => {
    try {
      setError("");
      setLoading(true); // Start loading
      const response = await axios.get(`/api/pubchem?cid=${cid}`);
      setCompoundData(response.data);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const exportToPdf = async () => {
    const cardElement = document.querySelector(".printable-card");

    if (!(cardElement instanceof HTMLElement)) return;

    const images = document.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else img.onload = () => resolve();
          })
      )
    );

    const canvas = await html2canvas(cardElement, {
      scale: 3,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Define padding
    const padding = 5;

    pdf.addImage(
      imgData,
      "PNG",
      padding,
      padding,
      pdfWidth - padding * 2,
      pdfHeight - padding * 2
    );

    const fileName = compoundData?.topLevelInfo?.recordTitle
      ? `${compoundData.topLevelInfo.recordTitle}.pdf`
      : "default-filename.pdf";

    pdf.save(fileName);
  };

  const exportToJpg = async () => {
    const cardElement = document.querySelector(
      ".printable-card"
    ) as HTMLElement | null;
    if (!cardElement) return;

    // Wait for images to load
    const images = document.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else img.onload = () => resolve();
          })
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 100)); // Short delay

    const canvas = await html2canvas(cardElement, {
      scale: 4,
      useCORS: true,
      backgroundColor: null, // Keep it transparent so we can see padded bg
    });

    const padding = 30;
    const paddedCanvas = document.createElement("canvas");
    const ctx = paddedCanvas.getContext("2d");
    paddedCanvas.width = canvas.width + padding * 2;
    paddedCanvas.height = canvas.height + padding * 2;

    if (ctx) {
      // Fill the padded area with a contrasting background (light gray)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
      // Draw the captured canvas offset by the padding
      ctx.drawImage(canvas, padding, padding);
    }

    const imgData = paddedCanvas.toDataURL("image/jpeg", 1.0);

    // For demonstration, let's just call it "padded-image.jpg"
    const fileName = compoundData?.topLevelInfo?.recordTitle
      ? `${compoundData.topLevelInfo.recordTitle}.jpg`
      : "default-filename.jpg";

    const link = document.createElement("a");
    link.href = imgData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // After downloading, open the image. You should see:
    // - A gray area (the padded region)
    // - Your `.printable-card` content inset by 30px
    // - If `.printable-card` has a border, you’ll see it clearly separated from the gray background.
  };

  // Define a function that maps signalWords to valid Chip colors
  function getChipColor(
    signalWord: string | null
  ): "default" | "primary" | "secondary" | "success" | "warning" | "danger" {
    if (!signalWord) return "default";

    const lower = signalWord.toLowerCase();
    if (lower === "warning") return "warning";
    if (lower === "danger") return "danger";

    return "default"; // fallback if none match
  }

  return (
    <div className="container">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-4">
          <p className="text-xl text-center font-bold">
            PubChem to GHS Label Generator
          </p>
        </div>
        <div className="col-span-3">
          <Input
            aria-label="Search"
            onChange={(e) => setCid(e.target.value)}
            value={cid}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchCompoundData();
              }
            }}
            classNames={{
              inputWrapper: "bg-default-100",
              input: "text-sm",
            }}
            endContent={
              <Kbd className="hidden lg:inline-block" keys={["enter"]}>
                return
              </Kbd>
            }
            labelPlacement="outside"
            placeholder="Enter PubChem CID"
            startContent={
              <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
            }
            type="search"
          />
          {error && <p className="text-rose-500 mt-4 text-sm">{error}</p>}
        </div>

        <div className="col-span-1">
          <Button onPress={fetchCompoundData}>Generate</Button>
        </div>
      </div>

      {/* Show loading indicator if data is being fetched */}
      {loading && (
        <div className="my-4 text-center">
          <p className="text-sm">Loading...</p>
        </div>
      )}

      {/* Only show the buttons after compoundData is fetched and not loading */}
      {compoundData && !loading && (
        <div className="col-span-4 mt-8">
          <ButtonGroup size="sm">
            <Button
              fullWidth
              onPress={exportToPdf}
              endContent={
                <Download className="text-base text-default-400 pointer-events-none flex-shrink-0" />
              }
            >
              Save PDF
            </Button>

            <Button
              fullWidth
              onPress={exportToJpg}
              endContent={
                <Download className="text-base text-default-400 pointer-events-none flex-shrink-0" />
              }
            >
              Save JPG
            </Button>
          </ButtonGroup>
        </div>
      )}

      <div>
        {compoundData && (
          <>
            <Card
              className="printable-card mt-4 mb-4"
              style={{ border: "1px solid rgb(228 228 231)" }}
            >
              <CardHeader className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex gap-3 items-center">
                  <div className="col-start-1 col-end-3">
                    {compoundData.topLevelInfo && (
                      <p className="text-3xl text-left font-bold">
                        {compoundData.topLevelInfo.recordTitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-start-4 col-end-4">
                  {compoundData.ghsInfo?.signalWord && (
                    <Chip color={getChipColor(compoundData.ghsInfo.signalWord)}>
                      <p className="text-md font-bold text-left text-white">
                        {compoundData.ghsInfo.signalWord}
                      </p>
                    </Chip>
                  )}
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <p className="text-sm">
                      <strong>IUPAC:</strong> {compoundData.IUPACName}
                    </p>
                    {compoundData.topLevelInfo && (
                      <p className="text-sm">
                        <strong>Pub Number:</strong>{" "}
                        {compoundData.topLevelInfo.recordNumber}
                      </p>
                    )}
                    <p className="text-sm">
                      <strong>CAS Number:</strong> {compoundData.casNumber}
                    </p>
                    <p className="text-xs mt-2">
                      <strong>Common Name:</strong> {compoundData.commonName}
                    </p>
                    <p className="text-xs">
                      <strong>Molecular Formula:</strong>{" "}
                      {compoundData.MolecularFormula}
                    </p>
                    <p className="text-xs">
                      <strong>Molecular Weight:</strong>{" "}
                      {compoundData.MolecularWeight} g/mol
                    </p>
                    <p className="text-xs">
                      <strong>SMILES Notation:</strong>{" "}
                      {compoundData.CanonicalSMILES}
                    </p>

                    {compoundData.hazardsSummary && (
                      <p className="mt-4 text-xs">
                        {compoundData.hazardsSummary}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1">
                    {Object.entries(fields).map(([key, value]) => (
                      <div key={key} className="mt-2">
                        <strong className="text-xs">
                          {key === "name"
                            ? "manufacturer"
                            : key.charAt(0).toUpperCase() + key.slice(1)}
                        </strong>
                        {editing[key as FieldKeys] ? (
                          <input
                            type="text"
                            value={value}
                            className="text-xs border border-gray-300 rounded p-1 w-full"
                            onChange={(e) =>
                              handleChange(key as FieldKeys, e.target.value)
                            }
                            onBlur={() => handleToggleEdit(key as FieldKeys)}
                            autoFocus
                          />
                        ) : (
                          <p
                            className="text-xs cursor-pointer"
                            onClick={() => handleToggleEdit(key as FieldKeys)}
                          >
                            {value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="col-span-4">
                    {compoundData.physicalDangers &&
                      compoundData.physicalDangers.length > 0 && (
                        <>
                          <p className="text-sm">
                            <strong>Physical Dangers:</strong>
                          </p>
                          <ul className="text-xs">
                            {compoundData.physicalDangers.map(
                              (danger, index) => (
                                <li key={index}>{danger}</li>
                              )
                            )}
                          </ul>
                        </>
                      )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {compoundData.hazardInformation &&
                    compoundData.hazardInformation.length > 0 && (
                      <>
                        <div className="col-span-4 ">
                          <p className="mt-4 mb-2 text-sm">
                            <strong>Hazard Information</strong>
                          </p>
                        </div>
                        {compoundData.hazardInformation.map((hazard, index) => (
                          <div
                            className="grid-flow-col auto-cols-max"
                            key={index}
                          >
                            <div className="flex flex-col items-center">
                              <img
                                src={hazard.url}
                                alt={hazard.description}
                                width="70"
                                height="70"
                              />
                              <p className="text-xs mt-2 text-center">
                                <strong>{hazard.description}</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                </div>
              </CardBody>
              <Divider />
            </Card>

            {compoundData.ghsInfo?.hazardStatements &&
              compoundData.ghsInfo.hazardStatements.length > 0 && (
                <Card className="max-w-[600px] mb-4">
                  <CardHeader>
                    <p className="text-sm">
                      <strong>GHS Hazard Statements - </strong>
                      {compoundData.topLevelInfo?.recordTitle}
                    </p>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <ul className="text-xs">
                      {compoundData.ghsInfo.hazardStatements.map(
                        (statement, index) => (
                          <li key={index}>{statement}</li>
                        )
                      )}
                    </ul>
                  </CardBody>
                </Card>
              )}

            {compoundData.firstAidMeasures &&
              compoundData.firstAidMeasures.length > 0 && (
                <Card className="max-w-[600px]">
                  <CardHeader>
                    <p className="text-sm">
                      <strong>First Aid Measures - </strong>
                      {compoundData.topLevelInfo?.recordTitle}
                    </p>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <ul className="text-xs">
                      {compoundData.firstAidMeasures.map((measure, index) => (
                        <li key={index}>
                          <strong>{measure.type}:</strong> {measure.instruction}
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              )}
          </>
        )}
      </div>
    </div>
  );
}
