import { useState } from 'react';
import { FormField, SectionHeading } from '../../../shared/components/ui';

export default function CategoriesSectorsScreen({ data, actions }) {
  const [categoryName, setCategoryName] = useState('');
  const [sectorName, setSectorName] = useState('');

  return (
    <div className="content-grid">
      <div className="section-card">
        <SectionHeading eyebrow="Program taxonomy" title="Categories" />
        <div className="tag-cloud">
          {data.categories.map((category) => (
            <span className="tag-chip" key={category.id}>
              {category.name}
            </span>
          ))}
        </div>
        <FormField label="New category" value={categoryName} onChange={setCategoryName} placeholder="Agriculture" />
        <button
          className="secondary-button"
          onClick={() => {
            actions.addTaxonomyItem('category', categoryName);
            setCategoryName('');
          }}
        >
          Add category
        </button>
      </div>

      <div className="section-card">
        <SectionHeading eyebrow="Program taxonomy" title="Sectors" />
        <div className="tag-cloud">
          {data.sectors.map((sector) => (
            <span className="tag-chip" key={sector.id}>
              {sector.name}
            </span>
          ))}
        </div>
        <FormField label="New sector" value={sectorName} onChange={setSectorName} placeholder="PWD" />
        <button
          className="secondary-button"
          onClick={() => {
            actions.addTaxonomyItem('sector', sectorName);
            setSectorName('');
          }}
        >
          Add sector
        </button>
      </div>
    </div>
  );
}
