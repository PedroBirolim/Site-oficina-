/**
 * CONFIGURAÇÃO CENTRAL DO SITE
 * Substitua somente os valores abaixo quando os dados oficiais estiverem disponíveis.
 * Os links de WhatsApp, telefone, Instagram e Waze são montados automaticamente.
 */

export const COMPANY_NAME = "PIT LANE";

// TODO: INSERIR WHATSAPP OFICIAL apenas com código do país + DDD + número (ex.: 5511999999999)
export const WHATSAPP_NUMBER = "";

// TODO: INSERIR TELEFONE OFICIAL e versão apenas com dígitos
export const PHONE_DISPLAY = "(00) 00000-0000";
export const PHONE_NUMBER = "";

// TODO: INSERIR INSTAGRAM OFICIAL
export const INSTAGRAM_HANDLE = "@SEUINSTAGRAM";
export const INSTAGRAM_URL = "https://www.instagram.com/";

// TODO: INSERIR ENDEREÇO COMPLETO
export const ADDRESS = "ENDEREÇO A DEFINIR";

// TODO: AJUSTAR HORÁRIO DE FUNCIONAMENTO
export const BUSINESS_HOURS = "HORÁRIO A DEFINIR";

// TODO: INSERIR DESTINO DO WAZE. Se latitude/longitude forem informadas, elas têm prioridade.
export const WAZE_DESTINATION = ADDRESS;
export const LATITUDE = null;
export const LONGITUDE = null;

// Logo oficial centralizada — utilizada por header, loading, mapa e footer.
export const LOGO_URL = "assets/brand/pit-lane-logo-official.png";

// TODO: SUBSTITUIR PELAS FOTOS REAIS AUTORIZADAS quando disponíveis
export const ACCESSORIES_IMAGE = "assets/images/service-accessories.jpg";
// IMAGEM DO CITROËN DS3 2013 — ANTES
export const BEFORE_IMAGE = "assets/images/before-after/ds3-before.jpg";
// IMAGEM DO CITROËN DS3 2013 — DEPOIS
export const AFTER_IMAGE = "assets/images/before-after/ds3-after.jpg";

export const HERO_HEADLINE = "SEU CARRO MERECE MAIS.";
export const WHATSAPP_MESSAGE = "Olá! Gostaria de solicitar uma avaliação para o meu veículo.";

const cleanNumber = (value) => String(value || "").replace(/\D/g, "");

export function buildWhatsAppUrl(message = WHATSAPP_MESSAGE) {
  const number = cleanNumber(WHATSAPP_NUMBER);
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildWazeUrl() {
  if (Number.isFinite(LATITUDE) && Number.isFinite(LONGITUDE)) {
    return `https://www.waze.com/ul?ll=${LATITUDE}%2C${LONGITUDE}&navigate=yes`;
  }

  return `https://www.waze.com/ul?q=${encodeURIComponent(WAZE_DESTINATION || ADDRESS)}&navigate=yes`;
}

export const siteConfig = {
  companyName: COMPANY_NAME,
  companyLogo: LOGO_URL,
  phone: PHONE_DISPLAY,
  phoneLink: PHONE_NUMBER ? `tel:${cleanNumber(PHONE_NUMBER)}` : "#contato",
  instagramHandle: INSTAGRAM_HANDLE,
  instagramLink: INSTAGRAM_URL,
  address: ADDRESS,
  businessHours: BUSINESS_HOURS,
  whatsappLink: buildWhatsAppUrl(),
  wazeLink: buildWazeUrl(),
  accessoriesImage: ACCESSORIES_IMAGE,
  beforeImage: BEFORE_IMAGE,
  afterImage: AFTER_IMAGE,
};
