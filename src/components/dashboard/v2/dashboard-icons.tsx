/**
 * Central icon registry for the dashboard-new page.
 *
 * The HTML sample (`samples/aortrack-dashboard.html`) ships a lot of inline
 * SVGs and a handful of emojis (⚠️, ✅, ✕, ✓, ⟳, 🍁, ✎, ⓘ). Per project
 * convention we replace every one of those with a `react-icons/fa` icon and
 * style it through CSS so the page never depends on font-emoji rendering.
 */

import {
  FaArrowRight,
  FaBell,
  FaCheck,
  FaCheckCircle,
  FaCommentDots,
  FaCopy,
  FaExclamationTriangle,
  FaGithub,
  FaInfoCircle,
  FaPencilAlt,
  FaPlus,
  FaRegStar,
  FaShareAlt,
  FaSyncAlt,
  FaTimes,
  FaTrashAlt,
  FaUser,
  FaUserFriends,
  FaWhatsapp,
  FaThLarge,
  FaRegClock,
  FaChartLine,
  FaHome,
  FaUpload,
  FaMagic,
} from "react-icons/fa";

/* ─── Sidebar ─── */
export const IconOverview = FaThLarge;
export const IconTimeline = FaRegClock;
export const IconCohort = FaUserFriends;
export const IconAlerts = FaBell;
export const IconFeed = FaCommentDots;
export const IconStats = FaChartLine;
export const IconPlus = FaPlus;
export const IconShare = FaShareAlt;
export const IconEmail = FaUser;
export const IconTrash = FaTrashAlt;

/* ─── Top bar ─── */
export const IconUpload = FaUpload;
export const IconLiveDot = FaCheckCircle; // unused but kept for parity
export const IconHome = FaHome;

/* ─── Alert / status ─── */
export const IconWarn = FaExclamationTriangle;
export const IconCheck = FaCheck;
export const IconCheckCircle = FaCheckCircle;
export const IconClose = FaTimes;
export const IconInfo = FaInfoCircle;
export const IconSync = FaSyncAlt; // "⟳"   in-progress dot
export const IconMagic = FaMagic;

/* ─── Timeline ─── */
export const IconEdit = FaPencilAlt;
export const IconArrowRight = FaArrowRight;

/* ─── Share ─── */
export const IconCopy = FaCopy;
export const IconWhatsapp = FaWhatsapp;
export const IconGithub = FaGithub;
export const IconStar = FaRegStar;
