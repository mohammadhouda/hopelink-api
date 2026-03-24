import {
  getRegistrationReport,
  getNgoReport,
  getUserReport,
  getProjectReport,
  getFilterOptions,
} from "../services/report.service.js";

export const registrationReport = async (req, res) => {
  try {
    const data = await getRegistrationReport(req.query);
    res.json(data);
  } catch (error) {
    console.error("Registration report error:", error);
    res.status(500).json({ error: "Failed to generate registration report" });
  }
};

export const ngoReport = async (req, res) => {
  try {
    const data = await getNgoReport(req.query);
    res.json(data);
  } catch (error) {
    console.error("NGO report error:", error);
    res.status(500).json({ error: "Failed to generate NGO report" });
  }
};

export const userReport = async (req, res) => {
  try {
    const data = await getUserReport(req.query);
    res.json(data);
  } catch (error) {
    console.error("User report error:", error);
    res.status(500).json({ error: "Failed to generate user report" });
  }
};

export const projectReport = async (req, res) => {
  try {
    const data = await getProjectReport(req.query);
    res.json(data);
  } catch (error) {
    console.error("Project report error:", error);
    res.status(500).json({ error: "Failed to generate project report" });
  }
};

export const filterOptions = async (req, res) => {
  try {
    const data = await getFilterOptions();
    res.json(data);
  } catch (error) {
    console.error("Filter options error:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
};