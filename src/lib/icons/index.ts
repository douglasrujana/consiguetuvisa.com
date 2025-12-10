/**
 * Design System - Iconos Centralizados
 * Fuente única de verdad para iconos en toda la aplicación
 * Usando Lucide Icons (ligero, consistente, profesional)
 */

// Re-exportar iconos usados en la aplicación
// Esto permite cambiar la librería de iconos en un solo lugar

export {
  // Navegación
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  
  // Usuarios y Auth
  User,
  Users,
  UserPlus,
  UserCheck,
  Shield,
  ShieldCheck,
  LogOut,
  LogIn,
  
  // Acciones CRUD
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  
  // Estados
  Loader2,
  AlertCircle,
  Info,
  AlertTriangle,
  
  // Documentos y Datos
  FileText,
  Files,
  FolderOpen,
  Search,
  Filter,
  
  // Configuración
  Settings,
  Sliders,
  
  // Comunicación
  Mail,
  Phone,
  MessageCircle,
  
  // Social
  Facebook,
  // WhatsApp no existe en Lucide, usar MessageCircle
  
  // Específicos del negocio
  Plane,
  CreditCard,
  Gift,
  Trophy,
  Sparkles,
  RefreshCw,
  
  // UI
  Eye,
  EyeOff,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Download,
  Upload,
} from 'lucide-svelte';

// Tamaños estándar según Design System
export const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

// Tipo para tamaños
export type IconSize = keyof typeof ICON_SIZES;
