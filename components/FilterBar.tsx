import React from 'react';
import { DocumentStatus } from '../types';

interface FilterBarProps {
  // Year/Quarter/Month (existing)
  filterYear: string;
  onFilterYearChange: (val: string) => void;
  filterQuarter: string;
  onFilterQuarterChange: (val: string) => void;
  filterMonth: string;
  onFilterMonthChange: (val: string) => void;

  // New filters
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  filterVendor: string;
  onFilterVendorChange: (val: string) => void;
  filterAccount: string;
  onFilterAccountChange: (val: string) => void;
  filterTaxCategory: string;
  onFilterTaxCategoryChange: (val: string) => void;

  // Available options
  availableVendors: string[];
  availableAccounts: string[];
  availableTaxCategories: { value: string; label: string }[];

  // Reset
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterYear,
  onFilterYearChange,
  filterQuarter,
  onFilterQuarterChange,
  filterMonth,
  onFilterMonthChange,
  filterStatus,
  onFilterStatusChange,
  filterVendor,
  onFilterVendorChange,
  filterAccount,
  onFilterAccountChange,
  filterTaxCategory,
  onFilterTaxCategoryChange,
  availableVendors,
  availableAccounts,
  availableTaxCategories,
  onResetFilters
}) => {
  const hasActiveFilters =
    filterYear !== 'all' ||
    filterQuarter !== 'all' ||
    filterMonth !== 'all' ||
    filterStatus !== 'all' ||
    filterVendor !== 'all' ||
    filterAccount !== 'all' ||
    filterTaxCategory !== 'all';

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterYear}
            onChange={(e) => onFilterYearChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="all">Jahr</option>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year.toString()}>{year}</option>;
            })}
          </select>

          <select
            value={filterQuarter}
            onChange={(e) => onFilterQuarterChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="all">Q</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>

          <select
            value={filterMonth}
            onChange={(e) => onFilterMonthChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="all">M</option>
            {Array.from({ length: 12 }, (_, i) => {
              const m = (i + 1).toString().padStart(2, '0');
              return <option key={m} value={m}>{i + 1}</option>;
            })}
          </select>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300" />

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500"
        >
          <option value="all">Status</option>
          <option value={DocumentStatus.COMPLETED}>Abgeschlossen</option>
          <option value={DocumentStatus.REVIEW_NEEDED}>Prüfen</option>
          <option value={DocumentStatus.PROCESSING}>In Bearbeitung</option>
          <option value={DocumentStatus.ERROR}>Fehler</option>
          <option value={DocumentStatus.DUPLICATE}>Duplikat</option>
        </select>

        {/* Vendor Filter */}
        <select
          value={filterVendor}
          onChange={(e) => onFilterVendorChange(e.target.value)}
          className="bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500 min-w-[140px]"
        >
          <option value="all">Lieferant</option>
          {availableVendors.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Account Filter */}
        <select
          value={filterAccount}
          onChange={(e) => onFilterAccountChange(e.target.value)}
          className="bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500 min-w-[120px]"
        >
          <option value="all">Konto</option>
          {availableAccounts.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Tax Category Filter */}
        <select
          value={filterTaxCategory}
          onChange={(e) => onFilterTaxCategoryChange(e.target.value)}
          className="bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 px-2 py-1.5 outline-none focus:border-blue-500 min-w-[140px]"
        >
          <option value="all">Steuerkategorie</option>
          {availableTaxCategories.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
};
