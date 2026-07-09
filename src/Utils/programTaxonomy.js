function normalizeTaxonomyName(value) {
  return String(value || '').trim();
}

function getTaxonomyKey(value) {
  return normalizeTaxonomyName(value).toLowerCase();
}

function addTaxonomyName(target, seenKeys, value) {
  const name = normalizeTaxonomyName(value);

  if (!name) {
    return;
  }

  const key = getTaxonomyKey(name);
  if (seenKeys.has(key)) {
    return;
  }

  seenKeys.add(key);
  target.push(name);
}

function getFallbackTaxonomyId(prefix, name) {
  return `${prefix}-${getTaxonomyKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item'}`;
}

export function getTaxonomyNames(items = [], programValues = []) {
  const names = [];
  const seenKeys = new Set();

  items.forEach((item) => addTaxonomyName(names, seenKeys, item?.name ?? item));
  programValues.forEach((value) => addTaxonomyName(names, seenKeys, value));

  return names;
}

export function getTaxonomyOptions(items = [], programValues = []) {
  return getTaxonomyNames(items, programValues).map((name) => ({
    label: name,
    value: name,
  }));
}

export function mergeTaxonomyItems(items = [], programValues = [], prefix = 'taxonomy') {
  const mergedItems = [];
  const seenKeys = new Set();

  items.forEach((item, index) => {
    const name = normalizeTaxonomyName(item?.name ?? item);
    if (!name) {
      return;
    }

    const key = getTaxonomyKey(name);
    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    mergedItems.push(
      typeof item === 'string'
        ? { id: getFallbackTaxonomyId(prefix, name), name }
        : {
            ...item,
            id: item?.id || `${prefix}-${index + 1}`,
            name,
          }
    );
  });

  programValues.forEach((value) => {
    const name = normalizeTaxonomyName(value);
    if (!name) {
      return;
    }

    const key = getTaxonomyKey(name);
    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    mergedItems.push({
      id: getFallbackTaxonomyId(prefix, name),
      name,
    });
  });

  return mergedItems;
}

export function hasSameTaxonomyNames(left = [], right = []) {
  const leftNames = getTaxonomyNames(left);
  const rightNames = getTaxonomyNames(right);

  if (leftNames.length !== rightNames.length) {
    return false;
  }

  return leftNames.every((name, index) => name === rightNames[index]);
}
