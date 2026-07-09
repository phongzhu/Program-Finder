insert into public.ref_municipalities (province_name, municipality_name)
values
  ('Bulacan', 'Angat'),
  ('Bulacan', 'Balagtas'),
  ('Bulacan', 'Baliwag City'),
  ('Bulacan', 'Bocaue'),
  ('Bulacan', 'Bulacan'),
  ('Bulacan', 'Bustos'),
  ('Bulacan', 'Calumpit'),
  ('Bulacan', 'Doña Remedios Trinidad'),
  ('Bulacan', 'Guiguinto'),
  ('Bulacan', 'Hagonoy'),
  ('Bulacan', 'Marilao'),
  ('Bulacan', 'Meycauayan City'),
  ('Bulacan', 'Malolos City'),
  ('Bulacan', 'Norzagaray'),
  ('Bulacan', 'Obando'),
  ('Bulacan', 'Pandi'),
  ('Bulacan', 'Paombong'),
  ('Bulacan', 'Plaridel'),
  ('Bulacan', 'Pulilan'),
  ('Bulacan', 'San Ildefonso'),
  ('Bulacan', 'San Miguel'),
  ('Bulacan', 'San Rafael'),
  ('Bulacan', 'Santa Maria'),
  ('Bulacan', 'City of San Jose del Monte')
on conflict (province_name, municipality_name) do nothing;

insert into public.program_categories (category_name, description)
values
  ('Education', 'Scholarship, school support, and other education-linked assistance programs.'),
  ('Livelihood', 'Livelihood starter support, work assistance, and income-generation programs.'),
  ('Health', 'Medical aid, medicine support, wellness packages, and health-related assistance.'),
  ('Business', 'Enterprise development, startup support, and market-readiness programs.')
on conflict (category_name) do nothing;

insert into public.sectors (sector_name, description)
values
  ('Youth', 'Students, out-of-school youth, and other youth beneficiaries.'),
  ('Employment', 'Workers, job seekers, and livelihood-oriented beneficiaries.'),
  ('Senior Citizens', 'Senior citizen beneficiaries and elder-focused support groups.'),
  ('Women', 'Women-focused assistance, empowerment, and enterprise support programs.')
on conflict (sector_name) do nothing;
