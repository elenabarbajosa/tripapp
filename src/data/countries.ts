import {
  getCountryData,
  getCountryDataList,
  getEmojiFlag,
  type ICountryData,
  type TCountryCode,
} from "countries-list";
import { getCurrency } from "countries-list/currencies";

export interface CountryOption {
  name: string;
  nativeName: string;
  countryCode: TCountryCode;
  alpha3: string;
  flag: string;
  currencyCode: string | null;
  currencyName: string | null;
  currencySymbol: string | null;
  aliases: string[];
}

function resolvePrimaryCurrency(codes: string[]): {
  currencyCode: string | null;
  currencyName: string | null;
  currencySymbol: string | null;
} {
  const primary = codes.find((code) => /^[A-Z]{3}$/.test(code));
  if (!primary) {
    return { currencyCode: null, currencyName: null, currencySymbol: null };
  }

  try {
    const details = getCurrency(primary as Parameters<typeof getCurrency>[0]);
    return {
      currencyCode: primary,
      currencyName: details.name,
      currencySymbol: details.symbol,
    };
  } catch {
    return { currencyCode: primary, currencyName: null, currencySymbol: null };
  }
}

function toCountryOption(data: ICountryData): CountryOption {
  const currency = resolvePrimaryCurrency(data.currency ?? []);
  return {
    name: data.name,
    nativeName: data.native,
    countryCode: data.iso2,
    alpha3: data.iso3,
    flag: getEmojiFlag(data.iso2),
    currencyCode: currency.currencyCode,
    currencyName: currency.currencyName,
    currencySymbol: currency.currencySymbol,
    aliases: data.alias ?? [],
  };
}

let cachedCountries: CountryOption[] | null = null;

export function listCountries(): CountryOption[] {
  if (!cachedCountries) {
    cachedCountries = getCountryDataList()
      .map(toCountryOption)
      .sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
  return cachedCountries;
}

export function getCountryByCode(code: string): CountryOption | null {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return null;
  }
  try {
    return toCountryOption(getCountryData(normalized as TCountryCode));
  } catch {
    return null;
  }
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchCountries(query: string): CountryOption[] {
  const needle = normalizeSearchText(query);
  if (!needle) {
    return listCountries();
  }

  return listCountries().filter((country) => {
    const haystacks = [
      country.name,
      country.nativeName,
      country.countryCode,
      country.alpha3,
      ...country.aliases,
    ].map(normalizeSearchText);

    return haystacks.some((haystack) => haystack.includes(needle));
  });
}

export function formatCurrencyLabel(country: CountryOption): string | null {
  if (!country.currencyCode) {
    return null;
  }
  if (country.currencyName) {
    return `Currency: ${country.currencyName} (${country.currencyCode})`;
  }
  return `Currency: ${country.currencyCode}`;
}

/** Primary trip currency = first destination with a resolved currency code. */
export function resolvePrimaryTripCurrency(
  destinations: { currencyCode: string | null | undefined }[],
): string | null {
  for (const destination of destinations) {
    const code = destination.currencyCode?.trim().toUpperCase();
    if (code && /^[A-Z]{3}$/.test(code)) {
      return code;
    }
  }
  return null;
}
