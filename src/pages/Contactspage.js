import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  Users, Plus, Edit, Trash2, X, Search, Filter, 
  Building2, Phone, Mail, User, FileText, Briefcase,
  UserPlus, Clock, CheckCircle2, PlayCircle, Archive,
  Upload, AlertCircle, TrendingDown, Award, Lock, XCircle,
  TrendingUp, History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES, PIPELINE_RESERVED_VALUES } from '../utils/pipeline';

const CATEGORIES = [
  'AutoMotive', 'Candy', 'Healthy Beauty Care', 'Package Beverage', 
  'Cigarettes', 'Smoking Accessories', 'Edible Grocery', 'Other Tobacco',
  'Salty Snacks', 'Package Sweet Snacks', 'General Merchandise', 
  'Package Ice Cream', 'B2B', 'Fruits & veg', 'Plastics', 'Raw Material',
  'Barista items', 'Protein Bar', 'Packaged Beverages', 'Other'
];

const REQUIRED_CONTACT_FIELDS = ['companyName', 'contactName', 'phone'];

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, '');

const getContactQualityScore = (contact) => {
  let score = 0;
  if (contact.companyName) score += 2;
  if (contact.contactName) score += 2;
  if (contact.phone) score += 2;
  if (contact.email) score += 1;
  if (contact.contactPosition) score += 1;
  if (contact.category) score += 1;
  if (contact.notes) score += 1;
  return score;
};

// COMPLETE CONTACT LIST - All contacts from the spreadsheet (300+ contacts)
const FULL_CONTACT_LIST = [
  { companyName: 'Al dawlia peing', contactName: 'yahia', contactPosition: '', phone: '1116021085', email: '', category: 'AutoMotive' },
  { companyName: 'Al shahin', contactName: 'Walid Zakaria / Maged', contactPosition: '', phone: '01007769673', email: '', category: 'Candy' },
  { companyName: 'Arab international company for wipes (Haigeen, zeina supplier)', contactName: 'Islam / Ayman', contactPosition: '', phone: '01225176701', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Beyti', contactName: 'Batoul / Marwan', contactPosition: '', phone: '01069988639', email: '', category: 'Package Beverage' },
  { companyName: 'Coca Cola', contactName: 'Amr / Omar', contactPosition: '', phone: '01272269556', email: '', category: 'Package Beverage' },
  { companyName: 'Mansour rel dawlia', contactName: 'Walid', contactPosition: '', phone: '1002189130', email: '', category: 'AutoMotive' },
  { companyName: 'Dija lighters', contactName: 'Mahmoud', contactPosition: '', phone: '1018766588', email: '', category: 'Smoking Accessories' },
  { companyName: 'Rashideeen cadbury', contactName: 'Yasser', contactPosition: '', phone: '0 111 033 0422', email: '', category: 'Candy' },
  { companyName: 'Raya', contactName: 'Hassan / Islam', contactPosition: '', phone: '01150900110', email: '', category: 'Candy' },
  { companyName: 'Zeina (egyptian company for papers)', contactName: 'Islam', contactPosition: '', phone: '1225176701', email: '', category: 'Healthy Beauty Care' },
  { companyName: '4 a nutrition', contactName: 'Mohamed', contactPosition: '', phone: '01000221912', email: 'mohamed.magdy022@gmail.com', category: 'Edible Grocery' },
  { companyName: 'Al zahraa', contactName: 'Ahmed', contactPosition: '', phone: '1272688811', email: 'www.sero_mido@yahoo.com', category: 'Other Tobacco' },
  { companyName: 'Alwaad', contactName: 'Ahmed / Mohamed', contactPosition: '', phone: '01068309504', email: 'raafat.ali@wicegypt.com', category: 'Package Beverage' },
  { companyName: 'Apex', contactName: 'Ayman', contactPosition: '', phone: '0 127 878 7962', email: 'management@egyapex.com', category: 'Smoking Accessories' },
  { companyName: 'Ayman affadny', contactName: 'Ahmed', contactPosition: '', phone: '0 102 105 7662', email: 'ahmad.fathy@aac-asgeg.com', category: 'Candy' },
  { companyName: 'Azzam for trading', contactName: 'Sherif / Mohamed Azzam', contactPosition: '', phone: '01024245500', email: 'info@azzam-group.com', category: 'Candy' },
  { companyName: 'Capital trade', contactName: 'Mohamed', contactPosition: '', phone: '1222231100', email: 'mshalaby@capitaltrade-eg.com', category: 'Edible Grocery' },
  { companyName: 'Chemi egypt', contactName: 'Shokran', contactPosition: '', phone: '1125657799', email: 'info@chemi-egypt.com', category: 'Healthy Beauty Care' },
  { companyName: 'Class A', contactName: 'Hany', contactPosition: '', phone: '1002243929', email: 'hanyzakaria@classatrading.com', category: 'Candy' },
  { companyName: 'cubers', contactName: 'Waleed / abdelaziz', contactPosition: '', phone: '01145366643', email: 'abdelazizelbayoumi@hotmail.com', category: 'Package Beverage' },
  { companyName: 'El Yasmin', contactName: 'Mohmamed fathy', contactPosition: '', phone: '1001028896', email: 'mohamed.fathy-alyasmin@vantageegypt.com', category: 'Candy' },
  { companyName: 'First trade EGYPT', contactName: 'Hassan shokry', contactPosition: '', phone: '1001052053', email: 'hshoukry@firstegypt.org', category: 'AutoMotive' },
  { companyName: 'Foodica plus', contactName: 'Karim', contactPosition: '', phone: '0 105 067 9711', email: 'infofoodica@gmail.com', category: 'Candy' },
  { companyName: 'Gharar (Kimbo)', contactName: 'Mohamed Fayez', contactPosition: '', phone: '', email: 'mohamed-fayez@ghrghar.com', category: 'Edible Grocery' },
  { companyName: 'Global water', contactName: 'Mohamed', contactPosition: '', phone: '01102177761', email: 'Mohamed.Farid@gid-egy.com', category: 'Package Beverage' },
  { companyName: 'Haramin / clean up', contactName: 'ramy / Riham', contactPosition: '', phone: '01111177729', email: 'Riham_Khalil@hotmail.com', category: 'AutoMotive' },
  { companyName: 'green apple', contactName: 'selim emad / Mohamed Hossam', contactPosition: '', phone: '01001808080', email: 'mohamed.hossam@greenapple-eg.com', category: 'Candy' },
  { companyName: 'ITC Slims', contactName: 'Amir', contactPosition: '', phone: '1203430911', email: 'amer_afify2000@yahoo.com', category: 'Cigarettes' },
  { companyName: 'Kandeel', contactName: 'Mohamed fared / Mohamed Ragab', contactPosition: '', phone: '01009155561', email: 'mohamed.fared@kandeel.org', category: 'AutoMotive' },
  { companyName: 'Lamar', contactName: 'Mohamed abdellatif / Ahmed Hafez', contactPosition: '', phone: '01228248907', email: 'mohamed.abdellatif@lamaregypt.com', category: 'Package Beverage' },
  { companyName: 'Lite bite', contactName: 'Paula', contactPosition: '', phone: '0 127 525 4366', email: 'litebite.sales@gmail.com', category: 'Package Sweet Snacks' },
  { companyName: 'Mansour distribution', contactName: 'Mohamed abdo / Salah', contactPosition: '', phone: '01229666188', email: 'mostafa.abdou@mansourgroup.com', category: 'Candy' },
  { companyName: 'Mansour distribution (Hayat)', contactName: 'Shenouda / Mohamed', contactPosition: '', phone: '01223976031', email: 'shenouda.talaat@mansourgroup.com', category: 'Package Beverage' },
  { companyName: 'Mansour redbull', contactName: 'Yasser Fares', contactPosition: '', phone: '01229441554', email: 'Yasser.Fares@mansourgroup.com', category: 'Package Beverage' },
  { companyName: 'Moonlight', contactName: 'Mohamed', contactPosition: '', phone: '01210599499', email: 'moonlightalexandria@outlook.com', category: 'Candy' },
  { companyName: 'Nilco', contactName: 'Eslam / Zeinab', contactPosition: '', phone: '01026799806', email: 'sales@nilco-int.com', category: 'General Merchandise' },
  { companyName: 'Oscar', contactName: 'Hany', contactPosition: '', phone: '01110005843', email: 'sales@oscarnuts.com', category: 'Salty Snacks' },
  { companyName: 'Pepsi', contactName: 'Islam', contactPosition: '', phone: '01159867611', email: 'islam.ghorab@pepsico.com', category: 'Package Beverage' },
  { companyName: 'Pharma Gen', contactName: 'Seif / Osama', contactPosition: '', phone: '01122961260', email: 'osama.rashedy@pharmagenhealthcare.com', category: 'Package Sweet Snacks' },
  { companyName: 'Soudanco', contactName: 'Mahmoud / Mostafa', contactPosition: '', phone: '01002160964', email: 'mostafa.hussein@soudanco.com', category: 'Candy' },
  { companyName: 'Rani', contactName: 'Hazem', contactPosition: '', phone: '01125387664', email: 'hazem.samir@aujan.com', category: 'Package Beverage' },
  { companyName: 'Right foods - raw', contactName: 'Sherif / Haitham', contactPosition: '', phone: '01008119091', email: 'sherif.alsayed@rightfoods.com.eg', category: 'Salty Snacks' },
  { companyName: 'Smash', contactName: 'mahmoud nagi', contactPosition: '', phone: '1225115116', email: 'mnagi@smashtrading.com', category: 'General Merchandise' },
  { companyName: 'Snack Land (Hype)', contactName: 'Youssef Gohar / Mohamed', contactPosition: '', phone: '0 100 161 9010', email: 'Mohamed.mostafa@snackland-eg.com', category: 'Package Beverage' },
  { companyName: 'Benchmark', contactName: 'Mostafa / Ahmed', contactPosition: '', phone: '01003395889', email: 'sales@benchmark-egypt.com', category: 'Healthy Beauty Care' },
  { companyName: 'UTC', contactName: 'sarah / Ahmed', contactPosition: '', phone: '01100641043', email: 'sarah.aly@utcegypt.net', category: 'Edible Grocery' },
  { companyName: 'Nestle Water', contactName: 'Ramy El Mondy / Mostafa / Mahmoud', contactPosition: '', phone: '01001181847', email: 'ramy.mondy@eg.nestle-waters.com', category: 'Package Beverage' },
  { companyName: 'Valley Water (Elano)', contactName: 'M.Saber / Islam', contactPosition: '', phone: '0 100 115 4039', email: 'Mohamed.Saber@valleywaterco.com', category: 'Package Beverage' },
  { companyName: 'Verdi Vacation (Ice breaker)', contactName: 'Mohamed / Mostafa', contactPosition: '', phone: '01013295264', email: 'ceo@icebreakeregypt.com', category: 'Package Beverage' },
  { companyName: 'JTI', contactName: 'Amir Riad', contactPosition: '', phone: '1013411114', email: 'Amir.Riad@jti.com', category: 'Cigarettes' },
  { companyName: 'IFIX', contactName: 'Fayez / Mostafa', contactPosition: '', phone: '01022212535', email: 'mohamed.fayez@ifixegypt.com', category: 'General Merchandise' },
  { companyName: 'Rush Cosmetics Perfumes', contactName: 'Ehab', contactPosition: '', phone: '1200001571', email: 'salaheldinkharma@hotmail.com', category: 'Healthy Beauty Care' },
  { companyName: 'Abo Import & Export', contactName: 'Mohamed / Nada', contactPosition: '', phone: '01066295223', email: 'sales@redseaworld.net', category: 'Package Beverage' },
  { companyName: 'Life Snacks', contactName: 'Amr Wanas / Abdelghani', contactPosition: '', phone: '01129090901', email: 'awanas@lifesnacks.me', category: 'Package Sweet Snacks' },
  { companyName: 'ACME GROUP', contactName: 'Nehal / Hossam', contactPosition: '', phone: '01221818818', email: 'nihal.habib@acme-group.net', category: 'Healthy Beauty Care' },
  { companyName: 'Energizer Egypt', contactName: 'Ahmed', contactPosition: '', phone: '0 100 522 8751', email: 'Ahmed.Asem@energizer.com', category: 'General Merchandise' },
  { companyName: 'Foodstuff (B S for trading & imports)', contactName: 'Hussein', contactPosition: '', phone: '1225631232', email: 'sales@foodstuff-eg.com', category: 'Candy' },
  { companyName: 'Blue star', contactName: 'Amer Farouk', contactPosition: '', phone: '1111993426', email: 'bluestarsest@gmail.com', category: 'Package Ice Cream' },
  { companyName: 'Happy Cow', contactName: 'ahmed / Amira', contactPosition: '', phone: '01220107111', email: 'ahmmed572014@gmail.com', category: 'Candy' },
  { companyName: 'TAM Group for commertial agencies', contactName: 'Amgad', contactPosition: '', phone: '1223482703', email: 'amgadtamgrp@gmail.com', category: 'General Merchandise' },
  { companyName: 'Juhayna', contactName: 'Seif El menshawy / Sherif', contactPosition: '', phone: '20 155 444 9694', email: 'seif.elmenshawy@juhayna.com', category: 'Package Beverage' },
  { companyName: 'Mars', contactName: 'Mohamed Ali / Mohamed Adel / Mahmoud', contactPosition: '', phone: '01011662257', email: 'mahmoud.zaazou@effem.com', category: 'Candy' },
  { companyName: 'El Koubacy', contactName: 'Marwa', contactPosition: '', phone: '01062551233', email: 'info@elkoubasy.com', category: 'Package Beverage' },
  { companyName: 'Froneri Ice Cream', contactName: 'Ahmed', contactPosition: '', phone: '1113680403', email: 'Ahmed.osman@eg.froneri.com', category: 'Package Ice Cream' },
  { companyName: 'Quatro', contactName: 'Mohmamed Agha', contactPosition: '', phone: '1001720366', email: 'magha@quatroseoudi.com', category: 'Package Beverage' },
  { companyName: 'energy Gate', contactName: 'Mahmoud Abdel Maksoud / Hesham', contactPosition: '', phone: '01022000700', email: 'hisham.khaled@energygate-eg.com', category: 'Candy' },
  { companyName: 'comptoir (Tirma Choc.)', contactName: 'Tamer Atef', contactPosition: '', phone: '1288886500', email: 'info@crc-egypt.com', category: 'Candy' },
  { companyName: 'Beeman Import & Export (Deema)', contactName: 'Eslam / Mostafa Mosalim / Adel', contactPosition: '', phone: '', email: 'sales@beemanegypt.com', category: 'Package Sweet Snacks' },
  { companyName: 'Squadra', contactName: 'Mohamed', contactPosition: '', phone: '1284877982', email: 'm.kamal@squadra-eg.co', category: 'Package Ice Cream' },
  { companyName: 'Kahwaji', contactName: 'Hesham / Mohamed', contactPosition: '', phone: '01113142303', email: 'kahwajicomapny@gmail.com', category: 'Edible Grocery' },
  { companyName: 'Kemet For Natural Food', contactName: 'Ahmed', contactPosition: '', phone: '01270083333', email: 'Ahmed.hatem47@gmail.com', category: 'Salty Snacks' },
  { companyName: 'Alzidan for trading and distribution (Ulker)', contactName: 'Eslam', contactPosition: '', phone: '1154216614', email: 'Eslam.yassin@pladisglobal.com', category: 'Package Sweet Snacks' },
  { companyName: 'Multi Food', contactName: 'Mohamed Daoud', contactPosition: '', phone: '1005204730', email: 'Orders@multifoodeg.com', category: 'Candy' },
  { companyName: 'Best buy', contactName: 'ibrahim', contactPosition: '', phone: '1009195551', email: 'salesaccount2@dilifoods.com', category: 'Package Beverage' },
  { companyName: 'empex', contactName: 'Abdullah', contactPosition: '', phone: '1126117977', email: 'keyaccount@empexfood.com', category: 'Salty Snacks' },
  { companyName: 'Trade masters', contactName: 'Ahmed sameh / Osama', contactPosition: '', phone: '1011477939', email: 'sales@tmcegy.com', category: 'Candy' },
  { companyName: 'Rashideen dettol', contactName: 'ahmed Ashour', contactPosition: '', phone: '1110330734', email: 'ahmed.sayed@rashideenegypt.net', category: 'Healthy Beauty Care' },
  { companyName: 'Solo Soft For Hygienic Paper', contactName: 'hany', contactPosition: '', phone: '01005313213', email: 'tmarketing@whitetissues.com', category: 'Healthy Beauty Care' },
  { companyName: 'IS Imaging Solutions', contactName: 'Mohamed Ismail', contactPosition: '', phone: '1000043647', email: 'sales@almazaq-eg.com', category: 'Edible Grocery' },
  { companyName: 'Bayoumi Foods (Fico)', contactName: 'Adham', contactPosition: '', phone: '1005444965', email: 'info.bayoumifoods@gmail.com', category: 'Salty Snacks' },
  { companyName: 'Monitoring Alert and Action Centre (MAAAC)', contactName: 'Mayar', contactPosition: '', phone: '1281118888', email: 'mayar@maaac-egypt.com', category: 'Other Tobacco' },
  { companyName: 'Riad Imports', contactName: 'Mahmoud', contactPosition: '', phone: '1093337000', email: 'riadtrade@hotmail.com', category: 'General Merchandise' },
  { companyName: 'Reach Trade & Marketing company', contactName: 'Mohamed / Haitham', contactPosition: '', phone: '01001238348', email: 'mohamed.elsayed@alahrambeverages.com', category: 'Package Beverage' },
  { companyName: 'Heim Foods', contactName: 'Marwan / Mostafa', contactPosition: '', phone: '1017000070', email: 'marwan.abbas@heimfood.com', category: 'Salty Snacks' },
  { companyName: 'Ghneim For Food Packaging, Import & Export', contactName: 'Ahmed', contactPosition: '', phone: '1020393001', email: 'ghoneimfoods@gmail.com', category: 'Salty Snacks' },
  { companyName: 'GENERAL COMMERCE CO.LTD', contactName: 'Amir', contactPosition: '', phone: '01021115605', email: 'amir@gccegypt.com', category: 'General Merchandise' },
  { companyName: 'A.U.F. Egypt', contactName: 'Mohamed / Aya / Abdelrahman', contactPosition: '', phone: '1020305513', email: 'mohamed.saeed@abu-auf.com', category: 'Salty Snacks' },
  { companyName: 'National Service Productive Projects (Safi)', contactName: 'Mohamed', contactPosition: '', phone: '1159000595', email: 'Banks@safiegypt.com', category: 'Package Beverage' },
  { companyName: 'Marion Trade', contactName: 'Mina', contactPosition: '', phone: '20 122 929 9500', email: 'mariontrade@yahoo.com', category: 'General Merchandise' },
  { companyName: 'E.S for Food and drinks', contactName: 'Karim', contactPosition: '', phone: '1284180554', email: 'Karim@es-eg.org', category: 'Edible Grocery' },
  { companyName: 'Greco Egypt for Food industries (G2G)', contactName: 'Mohamed', contactPosition: '', phone: '1000400007', email: 'mohamed.elsayed@greko-egypt.com', category: 'Edible Grocery' },
  { companyName: 'Rashideen Egypt For Trade (Bell)', contactName: 'Mahmed abdelhamid', contactPosition: '', phone: '1118240660', email: 'Mhameed@groupe-bel.com', category: 'Edible Grocery' },
  { companyName: 'GEM', contactName: 'David', contactPosition: '', phone: '0 122 944 2306', email: 'david@gemegypt.com', category: 'Healthy Beauty Care' },
  { companyName: 'Amico', contactName: 'M.Atya', contactPosition: '', phone: '0 100 091 0076', email: 'italian.food68@gmail.com', category: 'Package Beverage' },
  { companyName: 'Linah Farms', contactName: 'Youssef / Ziad', contactPosition: '', phone: '01201553884', email: 'y.abulwafa@linahfarms.com', category: 'Edible Grocery' },
  { companyName: "Marny's for Nutrition (Own snacks)", contactName: 'Mohamed', contactPosition: '', phone: '1223750730', email: 'm.olamy@ownsnacks.com', category: 'Package Sweet Snacks' },
  { companyName: 'Fast Track (london foods)', contactName: 'Alaa Atta / Amr Refaat', contactPosition: '', phone: '01005746412', email: 'mohamed.tolba@fasttrack-egy.com', category: 'Package Sweet Snacks' },
  { companyName: 'Beauty Mart For Trade', contactName: 'Mohamed', contactPosition: '', phone: '1062525090', email: 'mody25900@gmail.com', category: 'Healthy Beauty Care' },
  { companyName: 'Fine Hygienic', contactName: 'Eid', contactPosition: '', phone: '01275352712', email: 'ESaleh@finehh.com', category: 'Healthy Beauty Care' },
  { companyName: 'Real Nutrition', contactName: 'Mohamed', contactPosition: '', phone: '01140424712', email: 'nevin.farag@real-nutrition.com', category: 'Salty Snacks' },
  { companyName: 'Marvel', contactName: 'Abdelrahman / Ahmed', contactPosition: '', phone: '0 101 377 2787', email: 'Loai.elashmawy@marvell-eg.com', category: 'Candy' },
  { companyName: 'Kemet Eats', contactName: 'Amr Foad / Salah Amin', contactPosition: '', phone: '01005628959', email: 'orders@kemeteats.com', category: 'Salty Snacks' },
  { companyName: 'El Nour Industry', contactName: 'Sayed', contactPosition: '', phone: '1007303427', email: 'sayedalgouhary@gmail.com', category: 'Package Beverage' },
  { companyName: 'Food Trip', contactName: 'Ahmed Mousa / Karim / Pierre', contactPosition: '', phone: '01280705287', email: 'KA-NewSo@foodtripeg.com', category: 'Salty Snacks' },
  { companyName: 'Digma For Trading', contactName: 'Multiple contacts', contactPosition: '', phone: '01144494641', email: 'amr.ramadan@edita.com.eg', category: 'Package Sweet Snacks' },
  { companyName: 'AYS Capital', contactName: 'Nour Tawfik', contactPosition: '', phone: '1067763580', email: 'a.salaheldin@egintertrade.com', category: 'Protein Bar' },
  { companyName: 'Egypt International', contactName: 'Mohamed Hany', contactPosition: '', phone: '01003498794', email: 'Egypt.international@gmail.com', category: 'Candy' },
  { companyName: 'Badr - Salmon house', contactName: 'tarek', contactPosition: '', phone: '1060644404', email: 'tarek.zaazou@bfi.com.eg', category: 'B2B' },
  { companyName: 'Al Bardi Paper Mill', contactName: 'Ahmed Gamal', contactPosition: '', phone: '1550370103', email: 'salaa@finehh.com', category: 'B2B' },
  { companyName: 'Rich Food Company', contactName: 'Abdallah', contactPosition: '', phone: '01004432333', email: 't.elabrak@richfood-eg.com', category: 'B2B' },
  { companyName: 'Dakahlia Slaughter House', contactName: 'Ahmed', contactPosition: '', phone: '1127773577', email: 'ahmed.zaky@dakahlia.net', category: 'B2B' },
  { companyName: 'Imtenan', contactName: 'Adel', contactPosition: '', phone: '01150478558', email: 'ahmed.hamed@imtenan.com', category: 'B2B' },
  { companyName: 'Quanta', contactName: 'Walaa El Attar / Ahmed', contactPosition: '', phone: '01000298655', email: 'w.elataar@quanta-eg.com', category: 'Barista items' },
  { companyName: 'Al Shark Factory for industries', contactName: 'Karim Mohamed', contactPosition: '', phone: '01009787379', email: 'sales@dayemgroups.com', category: 'B2B' },
  { companyName: 'AWA', contactName: 'Sherif', contactPosition: '', phone: '1026016070', email: 'Sherif.abdelaziz@awa-foodsolutions.com', category: 'B2B' },
  { companyName: 'Fridal Fouad Tarek Abou Bakr', contactName: 'Dina', contactPosition: '', phone: '1022200851', email: 'dina.youssef@fridalegypt.com', category: 'B2B' },
  { companyName: 'Sharkawia Group for Trade Olivetta', contactName: 'khaled mohamed fawzy', contactPosition: '', phone: '01280162392', email: 'office@olivetta.com.eg', category: 'B2B' },
  { companyName: 'Ideal For Food Industries', contactName: 'Mohamed / Alaa', contactPosition: '', phone: '01000740019', email: 'ideal.ind2@hotmail.com', category: 'B2B' },
  { companyName: 'Egypt Germany for Food Industry (Taste pure)', contactName: 'youmna mohamed', contactPosition: '', phone: '1271376540', email: 'orders@egypt_germany.com', category: 'B2B' },
  { companyName: 'First Mix', contactName: 'Walid', contactPosition: '', phone: '1153077211', email: 'waled.mohamed@firstmix.com', category: 'B2B' },
  { companyName: 'El Mostakbal For Food Distribution', contactName: 'Tamer', contactPosition: '', phone: '1222871018', email: 'elmostakbal.eg@yahoo.com', category: 'B2B' },
  { companyName: "BUILDN'KO INVESTMENTS", contactName: 'Adam', contactPosition: '', phone: '1111103311', email: 'adam@interafricantrade.com', category: 'B2B' },
  { companyName: 'Diamond', contactName: 'Ahmed', contactPosition: '', phone: '1027117009', email: 'companyquality@gmail.com', category: 'B2B' },
  { companyName: 'Harvest', contactName: 'Shady', contactPosition: '', phone: '01205330402', email: 'sshaarawy@harvest.com.eg', category: 'B2B' },
  { companyName: 'El Helal & Golden Star for marketing & trade', contactName: 'Ali', contactPosition: '', phone: '1064100857', email: 'Khalifa.ahmed@helalgoldenstar.net', category: 'B2B' },
  { companyName: 'Ramses Fresh', contactName: 'Ahmed', contactPosition: '', phone: '1223111870', email: 'sales@ramsesfresh.com', category: 'B2B' },
  { companyName: 'King M', contactName: 'Amal', contactPosition: '', phone: '1288909330', email: 'kingm1986@yahoo.com', category: 'B2B' },
  { companyName: 'Olive valley', contactName: 'Ahmed', contactPosition: '', phone: '1003307304', email: 'Olivevalleypure@gmail.com', category: 'B2B' },
  { companyName: 'Halwani Brothers', contactName: 'Hany', contactPosition: '', phone: '1227343482', email: 'Homran@halwani-brothers.com', category: 'B2B' },
  { companyName: 'Mena Pack', contactName: 'Michael', contactPosition: '', phone: '1224148809', email: 'Info@menapack.net', category: 'B2B' },
  { companyName: 'Platinum for Import & Export', contactName: 'Hesham', contactPosition: '', phone: '1115050810', email: 'h.fawzy.zaazaagroup@gmail.com', category: 'B2B' },
  { companyName: 'Green Cola Egypt', contactName: 'Mohamed Yahia', contactPosition: '', phone: '0 1101313123', email: 'myahia@greencola.net', category: 'Package Beverage' },
  { companyName: 'Tiba Egypt for Trading', contactName: 'Amr / Adel / Hany', contactPosition: '', phone: '0 101 111 7331', email: 'amr.refaat@TibaGlobe.com', category: 'Candy' },
  { companyName: 'Alexandria confectionary (Corona)', contactName: 'Remon', contactPosition: '', phone: '01201222150', email: 'Remon.Adel@Corona-1919.com', category: 'Candy' },
  { companyName: 'Shelter Investment Group', contactName: 'Caroline Fahim', contactPosition: '', phone: '201020804724', email: 'c.fahim@shelterinestmentgroup.com', category: 'Other Tobacco' },
  { companyName: 'Flo water', contactName: 'Multiple contacts', contactPosition: '', phone: '01270135395', email: 'ahmed.swelam@flo-egypt.com', category: 'Package Beverage' },
  { companyName: 'Cairo 3A', contactName: 'Mohamed Abdallah', contactPosition: '', phone: '1099113637', email: 'mohamed.abdallah@cairo3a.net', category: 'Fruits & veg' },
  { companyName: 'PET', contactName: 'Ezz', contactPosition: '', phone: '1281437764', email: 'ezz@pet-egypt.com', category: 'Plastics' },
  { companyName: 'El-Amir for Commercial Agencies', contactName: 'Mahmoud / Mohamed', contactPosition: '', phone: '01096029102', email: 'Mahmoud.Abdallah@kellogg.com', category: 'Salty Snacks' },
  { companyName: 'Bloom', contactName: 'abdallah elsayed', contactPosition: '', phone: '0109 5239110', email: 'sales@crush-monster.com', category: 'Salty Snacks' },
  { companyName: 'Senyorita for food industries', contactName: 'Mohamed Bahnasy', contactPosition: '', phone: '1283222201', email: 'mmElbahnasy@americana-food.com', category: 'Salty Snacks' },
  { companyName: 'Pyramid Poultry', contactName: 'Mahmoud Hemida', contactPosition: '', phone: '1001859536', email: 'mahmoud.akl@pyramidpoultry.com', category: 'Raw Material' },
  { companyName: 'Willy Group', contactName: 'Amir', contactPosition: '', phone: '1111816333', email: 'amirfawzy@willygr.com', category: 'AutoMotive' },
  { companyName: 'Glory Trading', contactName: 'Mahmoud', contactPosition: '', phone: '1222288312', email: 'info@glorytradingeg.com', category: 'Candy' },
  { companyName: 'Hectare Group', contactName: 'norhan / Asmaa', contactPosition: '', phone: '1120840642', email: 'n.samir@hectare-group.com', category: 'Salty Snacks' },
  { companyName: 'El tanbouli for packing', contactName: 'Badea / Hamada / Ayman', contactPosition: '', phone: '1221845370', email: 'badea@tanboulifoodstuff.com', category: 'Package Sweet Snacks' },
  { companyName: 'Meringo', contactName: 'Mostafa', contactPosition: '', phone: '1033966327', email: 'MEssam@meringofoods.com', category: 'Candy' },
  { companyName: 'El Tahan', contactName: 'Ahmed', contactPosition: '', phone: '01000203794', email: 'a.bargoht@altahhan-dates.com', category: 'Package Sweet Snacks' },
  { companyName: 'Tovan Group', contactName: 'Hossam hamada', contactPosition: '', phone: '1007017033', email: 'nillisgelato@gmail.com', category: 'Package Ice Cream' },
  { companyName: 'Meditteraneo Industries', contactName: 'Haitham El Malt', contactPosition: '', phone: '1061354345', email: 'haitham.elmalt@mediterraneo-egypt.com', category: 'Barista items' },
  { companyName: 'Misr Pyramids-Crown', contactName: 'Alaa', contactPosition: '', phone: '1223630576', email: 'anagah@mpg-eg.com', category: 'General Merchandise' },
  { companyName: 'Interline', contactName: 'Ali', contactPosition: '', phone: '01118531850', email: 'Ali.Mousa@interline-eg.com', category: 'Candy' },
  { companyName: 'Al Ashraf for trading', contactName: 'Mahmoud / Khaled', contactPosition: '', phone: '0 111 363 7123', email: 'soudi9027@gmail.com', category: 'Healthy Beauty Care' },
  // Additional contacts from second spreadsheet section
  { companyName: 'WE / telecom egypt', contactName: 'Reem', contactPosition: '', phone: '01018473800', email: '', category: 'Other' },
  { companyName: 'Vodafone', contactName: 'Nahd', contactPosition: '', phone: '01000585881', email: '', category: 'Other' },
  { companyName: 'Etisalat', contactName: 'sara adel', contactPosition: '', phone: '1110503030', email: '', category: 'Other' },
  { companyName: 'watch it', contactName: 'ayah osama', contactPosition: '', phone: '1004379367', email: 'ayah.osama@watchit.com', category: 'Other' },
  { companyName: 'GESR', contactName: 'salma', contactPosition: '', phone: '1021144481', email: '', category: 'Other' },
  { companyName: 'johnson', contactName: 'morouh', contactPosition: '', phone: '1008857886', email: 'mcharmy@scj.com', category: 'Other' },
  { companyName: 'injaz', contactName: 'rania elgammal', contactPosition: '', phone: '', email: 'rgamil@injaz-egypt.org', category: 'Other' },
  { companyName: 'you think green', contactName: 'nadiene', contactPosition: '', phone: '1033771644', email: 'nadine@ytg.eco', category: 'Other' },
  { companyName: 'Rizkalla', contactName: 'Marie sami', contactPosition: '', phone: '1208797979', email: '', category: 'Other' },
  { companyName: 'SWVL', contactName: 'mohamed ibrahim', contactPosition: '', phone: '1002082740', email: '', category: 'Other' },
  { companyName: 'pizza station', contactName: 'hatem hassan', contactPosition: '', phone: '201111115573', email: 'hatemelnaggar@gmail.com', category: 'Other' },
  { companyName: 'Raseedi', contactName: 'samual', contactPosition: '', phone: '1227007299', email: 'sam@raseedi.co', category: 'Other' },
  { companyName: 'sofy', contactName: 'natali', contactPosition: '', phone: '1222211371', email: '', category: 'Other' },
  { companyName: 'Henkel', contactName: 'salma azhary', contactPosition: '', phone: '1005502685', email: '', category: 'Other' },
  { companyName: 'Andalusia', contactName: 'Mandy Maged', contactPosition: '', phone: '1069110582', email: '', category: 'Other' },
  { companyName: 'GEMS egypt schools', contactName: 'nada', contactPosition: '', phone: '1114045671', email: 'nada.khairy@gemseducation.com', category: 'Other' },
  { companyName: 'ahmed tea', contactName: 'hany ezz', contactPosition: '', phone: '100 695 4747', email: '', category: 'Other' },
  { companyName: '4 a nutrition', contactName: 'Mohamed', contactPosition: '', phone: '01000221912', email: '', category: 'Edible Grocery' },
  { companyName: 'Al zahraa', contactName: 'Ahmed', contactPosition: '', phone: '1272688811', email: '', category: 'Other Tobacco' },
  { companyName: 'Alwaad', contactName: 'Ahmed / Mohamed', contactPosition: '', phone: '01068309504', email: '', category: 'Package Beverage' },
  { companyName: 'Apex', contactName: 'Ayman', contactPosition: '', phone: '0 127 878 7962', email: '', category: 'Smoking Accessories' },
  { companyName: 'Ayman affadny', contactName: 'Ahmed', contactPosition: '', phone: '0 102 105 7662', email: '', category: 'Candy' },
  { companyName: 'Azzam for trading', contactName: 'Sherif / Mohamed Azzam', contactPosition: '', phone: '01024245500', email: '', category: 'Candy' },
  { companyName: 'Capital trade', contactName: 'Mohamed', contactPosition: '', phone: '1222231100', email: '', category: 'Edible Grocery' },
  { companyName: 'Chemi egypt', contactName: 'Shokran', contactPosition: '', phone: '1125657799', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Class A', contactName: 'Hany', contactPosition: '', phone: '1002243929', email: '', category: 'Candy' },
  { companyName: 'cubers', contactName: 'Waleed / abdelaziz', contactPosition: '', phone: '01145366643', email: '', category: 'Package Beverage' },
  { companyName: 'El Yasmin', contactName: 'Mohmamed fathy', contactPosition: '', phone: '1001028896', email: '', category: 'Candy' },
  { companyName: 'First trade EGYPT', contactName: 'Hassan shokry', contactPosition: '', phone: '1001052053', email: '', category: 'AutoMotive' },
  { companyName: 'Foodica plus', contactName: 'Karim', contactPosition: '', phone: '0 105 067 9711', email: '', category: 'Candy' },
  { companyName: 'Gharar (Kimbo)', contactName: 'Mohamed Fayez', contactPosition: '', phone: '', email: '', category: 'Edible Grocery' },
  { companyName: 'Global water', contactName: 'Mohamed', contactPosition: '', phone: '01102177761', email: '', category: 'Package Beverage' },
  { companyName: 'Haramin / clean up', contactName: 'ramy / Riham', contactPosition: '', phone: '01111177729', email: '', category: 'AutoMotive' },
  { companyName: 'green apple', contactName: 'selim emad / Mohamed Hossam', contactPosition: '', phone: '01001808080', email: '', category: 'Candy' },
  { companyName: 'ITC Slims', contactName: 'Amir', contactPosition: '', phone: '1203430911', email: '', category: 'Cigarettes' },
  { companyName: 'Kandeel', contactName: 'Mohamed fared / Mohamed Ragab', contactPosition: '', phone: '01009155561', email: '', category: 'AutoMotive' },
  { companyName: 'Lamar', contactName: 'Mohamed abdellatif / Ahmed Hafez', contactPosition: '', phone: '01228248907', email: '', category: 'Package Beverage' },
  { companyName: 'Lite bite', contactName: 'Paula', contactPosition: '', phone: '0 127 525 4366', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Mansour distribution', contactName: 'Mohamed abdo / Salah', contactPosition: '', phone: '01229666188', email: '', category: 'Candy' },
  { companyName: 'Mansour distribution (Hayat)', contactName: 'Shenouda / Mohamed', contactPosition: '', phone: '01223976031', email: '', category: 'Package Beverage' },
  { companyName: 'Mansour redbull', contactName: 'Yasser Fares', contactPosition: '', phone: '01229441554', email: '', category: 'Package Beverage' },
  { companyName: 'Moonlight', contactName: 'Mohamed', contactPosition: '', phone: '01210599499', email: '', category: 'Candy' },
  { companyName: 'Nilco', contactName: 'Eslam / Zeinab', contactPosition: '', phone: '01026799806', email: '', category: 'General Merchandise' },
  { companyName: 'Oscar', contactName: 'Hany', contactPosition: '', phone: '01110005843', email: '', category: 'Salty Snacks' },
  { companyName: 'Pepsi', contactName: 'Islam', contactPosition: '', phone: '01159867611', email: '', category: 'Package Beverage' },
  { companyName: 'Pharma Gen', contactName: 'Seif / Osama', contactPosition: '', phone: '01122961260', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Soudanco', contactName: 'Mahmoud / Mostafa', contactPosition: '', phone: '01002160964', email: '', category: 'Candy' },
  { companyName: 'Rani', contactName: 'Hazem', contactPosition: '', phone: '01125387664', email: '', category: 'Package Beverage' },
  { companyName: 'Right foods - raw', contactName: 'Sherif / Haitham', contactPosition: '', phone: '01008119091', email: '', category: 'Salty Snacks' },
  { companyName: 'Smash', contactName: 'mahmoud nagi', contactPosition: '', phone: '1225115116', email: '', category: 'General Merchandise' },
  { companyName: 'Snack Land (Hype)', contactName: 'Youssef Gohar / Mohamed', contactPosition: '', phone: '0 100 161 9010', email: '', category: 'Package Beverage' },
  { companyName: 'Benchmark', contactName: 'Mostafa / Ahmed', contactPosition: '', phone: '01003395889', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'UTC', contactName: 'sarah / Ahmed', contactPosition: '', phone: '01100641043', email: '', category: 'Edible Grocery' },
  { companyName: 'Nestle Water', contactName: 'Ramy El Mondy / Mostafa / Mahmoud', contactPosition: '', phone: '01001181847', email: '', category: 'Package Beverage' },
  { companyName: 'Valley Water (Elano)', contactName: 'M.Saber / Islam', contactPosition: '', phone: '0 100 115 4039', email: '', category: 'Package Beverage' },
  { companyName: 'Verdi Vacation (Ice breaker)', contactName: 'Mohamed / Mostafa', contactPosition: '', phone: '01013295264', email: '', category: 'Package Beverage' },
  { companyName: 'JTI', contactName: 'Amir Riad', contactPosition: '', phone: '1013411114', email: '', category: 'Cigarettes' },
  { companyName: 'IFIX', contactName: 'Fayez / Mostafa', contactPosition: '', phone: '01022212535', email: '', category: 'General Merchandise' },
  { companyName: 'Rush Cosmetics Perfumes', contactName: 'Ehab', contactPosition: '', phone: '1200001571', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Abo Import & Export', contactName: 'Mohamed / Nada', contactPosition: '', phone: '01066295223', email: '', category: 'Package Beverage' },
  { companyName: 'Life Snacks', contactName: 'Amr Wanas / Abdelghani', contactPosition: '', phone: '01129090901', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'ACME GROUP', contactName: 'Nehal / Hossam', contactPosition: '', phone: '01221818818', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Egypt Trading Co ETCo', contactName: 'Mahmoud', contactPosition: '', phone: '1286357387', email: '', category: 'Other' },
  { companyName: 'Energizer Egypt', contactName: 'Ahmed', contactPosition: '', phone: '0 100 522 8751', email: '', category: 'General Merchandise' },
  { companyName: 'Foodstuff (B S for trading & imports)', contactName: 'Hussein', contactPosition: '', phone: '1225631232', email: '', category: 'Candy' },
  { companyName: 'Blue star', contactName: 'Amer Farouk', contactPosition: '', phone: '1111993426', email: '', category: 'Package Ice Cream' },
  { companyName: 'Happy Cow', contactName: 'ahmed / Amira', contactPosition: '', phone: '01220107111', email: '', category: 'Candy' },
  { companyName: 'TAM Group for commertial agencies', contactName: 'Amgad', contactPosition: '', phone: '1223482703', email: '', category: 'General Merchandise' },
  { companyName: 'Juhayna', contactName: 'Seif El menshawy / Sherif', contactPosition: '', phone: '20 155 444 9694', email: '', category: 'Package Beverage' },
  { companyName: 'Mars', contactName: 'Mohamed Ali / Mohamed Adel / Mahmoud', contactPosition: '', phone: '01011662257', email: '', category: 'Candy' },
  { companyName: 'El Koubacy', contactName: 'Marwa', contactPosition: '', phone: '01062551233', email: '', category: 'Package Beverage' },
  { companyName: 'Froneri Ice Cream', contactName: 'Ahmed', contactPosition: '', phone: '1113680403', email: '', category: 'Package Ice Cream' },
  { companyName: 'Quatro', contactName: 'Mohmamed Agha', contactPosition: '', phone: '1001720366', email: '', category: 'Package Beverage' },
  { companyName: 'energy Gate', contactName: 'Mahmoud Abdel Maksoud / Hesham', contactPosition: '', phone: '01022000700', email: '', category: 'Candy' },
  { companyName: 'comptoir (Tirma Choc.)', contactName: 'Tamer Atef', contactPosition: '', phone: '1288886500', email: '', category: 'Candy' },
  { companyName: 'Beeman Import & Export (Deema)', contactName: 'Eslam / Mostafa Mosalim / Adel', contactPosition: '', phone: '', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Squadra', contactName: 'Mohamed', contactPosition: '', phone: '1284877982', email: '', category: 'Package Ice Cream' },
  { companyName: 'Kahwaji', contactName: 'Hesham / Mohamed', contactPosition: '', phone: '01113142303', email: '', category: 'Edible Grocery' },
  { companyName: 'Kemet For Natural Food', contactName: 'Ahmed', contactPosition: '', phone: '01270083333', email: '', category: 'Salty Snacks' },
  { companyName: 'Alzidan for trading and distribution (Ulker)', contactName: 'Eslam', contactPosition: '', phone: '1154216614', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Multi Food', contactName: 'Mohamed Daoud', contactPosition: '', phone: '1005204730', email: '', category: 'Candy' },
  { companyName: 'Best buy', contactName: 'ibrahim', contactPosition: '', phone: '1009195551', email: '', category: 'Package Beverage' },
  { companyName: 'empex', contactName: 'Abdullah', contactPosition: '', phone: '1126117977', email: '', category: 'Salty Snacks' },
  { companyName: 'Trade masters', contactName: 'Ahmed sameh / Osama', contactPosition: '', phone: '1011477939', email: '', category: 'Candy' },
  { companyName: 'Rashideen dettol', contactName: 'ahmed Ashour', contactPosition: '', phone: '1110330734', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Solo Soft For Hygienic Paper', contactName: 'hany', contactPosition: '', phone: '01005313213', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'IS Imaging Solutions', contactName: 'Mohamed Ismail', contactPosition: '', phone: '1000043647', email: '', category: 'Edible Grocery' },
  { companyName: 'Bayoumi Foods (Fico)', contactName: 'Adham', contactPosition: '', phone: '1005444965', email: '', category: 'Salty Snacks' },
  { companyName: 'Monitoring Alert and Action Centre (MAAAC)', contactName: 'Mayar', contactPosition: '', phone: '1281118888', email: '', category: 'Other Tobacco' },
  { companyName: 'Riad Imports', contactName: 'Mahmoud', contactPosition: '', phone: '1093337000', email: '', category: 'General Merchandise' },
  { companyName: 'Reach Trade & Marketing company', contactName: 'Mohamed / Haitham', contactPosition: '', phone: '01001238348', email: '', category: 'Package Beverage' },
  { companyName: 'Heim Foods', contactName: 'Marwan / Mostafa', contactPosition: '', phone: '1017000070', email: '', category: 'Salty Snacks' },
  { companyName: 'Ghneim For Food Packaging, Import & Export', contactName: 'Ahmed', contactPosition: '', phone: '1020393001', email: '', category: 'Salty Snacks' },
  { companyName: 'GENERAL COMMERCE CO.LTD', contactName: 'Amir', contactPosition: '', phone: '01021115605', email: '', category: 'General Merchandise' },
  { companyName: 'A.U.F. Egypt', contactName: 'Mohamed / Aya / Abdelrahman', contactPosition: '', phone: '1020305513', email: '', category: 'Salty Snacks' },
  { companyName: 'National Service Productive Projects (Safi)', contactName: 'Mohamed', contactPosition: '', phone: '1159000595', email: '', category: 'Package Beverage' },
  { companyName: 'Marion Trade', contactName: 'Mina', contactPosition: '', phone: '20 122 929 9500', email: '', category: 'General Merchandise' },
  { companyName: 'E.S for Food and drinks', contactName: 'Karim', contactPosition: '', phone: '1284180554', email: '', category: 'Edible Grocery' },
  { companyName: 'Greco Egypt for Food industries (G2G)', contactName: 'Mohamed', contactPosition: '', phone: '1000400007', email: '', category: 'Edible Grocery' },
  { companyName: 'Rashideen Egypt For Trade (Bell)', contactName: 'Mahmed abdelhamid', contactPosition: '', phone: '1118240660', email: '', category: 'Edible Grocery' },
  { companyName: 'GEM', contactName: 'David', contactPosition: '', phone: '0 122 944 2306', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Amico', contactName: 'M.Atya', contactPosition: '', phone: '0 100 091 0076', email: '', category: 'Package Beverage' },
  { companyName: 'Linah Farms', contactName: 'Youssef / Ziad', contactPosition: '', phone: '01201553884', email: '', category: 'Edible Grocery' },
  { companyName: "Marny's for Nutrition (Own snacks)", contactName: 'Mohamed', contactPosition: '', phone: '1223750730', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Fast Track (london foods)', contactName: 'Alaa Atta / Amr Refaat', contactPosition: '', phone: '01005746412', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Beauty Mart For Trade', contactName: 'Mohamed', contactPosition: '', phone: '1062525090', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Fine Hygienic', contactName: 'Eid', contactPosition: '', phone: '01275352712', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'Real Nutrition', contactName: 'Mohamed', contactPosition: '', phone: '01140424712', email: '', category: 'Salty Snacks' },
  { companyName: 'Marvel', contactName: 'Abdelrahman / Ahmed', contactPosition: '', phone: '0 101 377 2787', email: '', category: 'Candy' },
  { companyName: 'Kemet Eats', contactName: 'Amr Foad / Salah Amin', contactPosition: '', phone: '01005628959', email: '', category: 'Salty Snacks' },
  { companyName: 'El Nour Industry', contactName: 'Sayed', contactPosition: '', phone: '1007303427', email: '', category: 'Package Beverage' },
  { companyName: 'Food Trip', contactName: 'Ahmed Mousa / Karim / Pierre', contactPosition: '', phone: '01280705287', email: '', category: 'Salty Snacks' },
  { companyName: 'Digma For Trading', contactName: 'Multiple contacts', contactPosition: '', phone: '01144494641', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'AYS Capital', contactName: 'Nour Tawfik', contactPosition: '', phone: '1067763580', email: '', category: 'Protein Bar' },
  { companyName: 'Egypt International', contactName: 'Mohamed Hany', contactPosition: '', phone: '01003498794', email: '', category: 'Candy' },
  { companyName: 'Badr - Salmon house', contactName: 'tarek', contactPosition: '', phone: '1060644404', email: '', category: 'B2B' },
  { companyName: 'Al Bardi Paper Mill', contactName: 'Ahmed Gamal', contactPosition: '', phone: '1550370103', email: '', category: 'B2B' },
  { companyName: 'Rich Food Company', contactName: 'Abdallah', contactPosition: '', phone: '01004432333', email: '', category: 'B2B' },
  { companyName: 'Dakahlia Slaughter House', contactName: 'Ahmed', contactPosition: '', phone: '1127773577', email: '', category: 'B2B' },
  { companyName: 'Imtenan', contactName: 'Adel', contactPosition: '', phone: '01150478558', email: '', category: 'B2B' },
  { companyName: 'Quanta', contactName: 'Walaa El Attar / Ahmed', contactPosition: '', phone: '01000298655', email: '', category: 'Barista items' },
  { companyName: 'Al Shark Factory for industries', contactName: 'Karim Mohamed', contactPosition: '', phone: '01009787379', email: '', category: 'B2B' },
  { companyName: 'AWA', contactName: 'Sherif', contactPosition: '', phone: '1026016070', email: '', category: 'B2B' },
  { companyName: 'Fridal Fouad Tarek Abou Bakr', contactName: 'Dina', contactPosition: '', phone: '1022200851', email: '', category: 'B2B' },
  { companyName: 'Fridal Egypt', contactName: 'Dina', contactPosition: '', phone: '1022200851', email: '', category: 'B2B' },
  { companyName: 'Sharkawia Group for Trade Olivetta', contactName: 'khaled mohamed fawzy', contactPosition: '', phone: '01280162392', email: '', category: 'B2B' },
  { companyName: 'Ideal For Food Industries', contactName: 'Mohamed / Alaa', contactPosition: '', phone: '01000740019', email: '', category: 'B2B' },
  { companyName: 'Egypt Germany for Food Industry (Taste pure)', contactName: 'youmna mohamed', contactPosition: '', phone: '1271376540', email: '', category: 'B2B' },
  { companyName: 'First Mix', contactName: 'Walid', contactPosition: '', phone: '1153077211', email: '', category: 'B2B' },
  { companyName: 'El Mostakbal For Food Distribution', contactName: 'Tamer', contactPosition: '', phone: '1222871018', email: '', category: 'B2B' },
  { companyName: "BUILDN'KO INVESTMENTS", contactName: 'Adam', contactPosition: '', phone: '1111103311', email: '', category: 'B2B' },
  { companyName: 'Diamond', contactName: 'Ahmed', contactPosition: '', phone: '1027117009', email: '', category: 'B2B' },
  { companyName: 'Harvest', contactName: 'Shady', contactPosition: '', phone: '01205330402', email: '', category: 'B2B' },
  { companyName: 'El Helal & Golden Star for marketing & trade', contactName: 'Ali', contactPosition: '', phone: '1064100857', email: '', category: 'B2B' },
  { companyName: 'Ramses Fresh', contactName: 'Ahmed', contactPosition: '', phone: '1223111870', email: '', category: 'B2B' },
  { companyName: 'King M', contactName: 'Amal', contactPosition: '', phone: '1288909330', email: '', category: 'B2B' },
  { companyName: 'Olive valley', contactName: 'Ahmed', contactPosition: '', phone: '1003307304', email: '', category: 'B2B' },
  { companyName: 'Halwani Brothers', contactName: 'Hany', contactPosition: '', phone: '1227343482', email: '', category: 'B2B' },
  { companyName: 'Mena Pack', contactName: 'Michael', contactPosition: '', phone: '1224148809', email: '', category: 'B2B' },
  { companyName: 'Platinum for Import & Export', contactName: 'Hesham', contactPosition: '', phone: '1115050810', email: '', category: 'B2B' },
  { companyName: 'THE Egyptian meat processing company (Mitco)', contactName: '', contactPosition: '', phone: '', email: '', category: 'B2B' },
  { companyName: 'Fruttella For Food Industry S.A.E', contactName: 'Ibrahim', contactPosition: '', phone: '1101501999', email: '', category: 'B2B' },
  { companyName: 'Pretto Food For Food Industries', contactName: 'Osama', contactPosition: '', phone: '1223838685', email: '', category: 'B2B' },
  { companyName: 'Prima for Advanced Foods Industries S.A.E', contactName: 'Ahmed', contactPosition: '', phone: '1220777323', email: '', category: 'B2B' },
  { companyName: 'Haj Arafa', contactName: 'Faten', contactPosition: '', phone: '1158623833', email: '', category: 'B2B' },
  { companyName: 'Green Cola Egypt', contactName: 'Mohamed Yahia', contactPosition: '', phone: '0 1101313123', email: '', category: 'Package Beverage' },
  { companyName: 'Food box', contactName: 'Ashraf', contactPosition: '', phone: '1156080899', email: '', category: 'B2B' },
  { companyName: 'Tiba Egypt for Trading', contactName: 'Amr / Adel / Hany', contactPosition: '', phone: '0 101 111 7331', email: '', category: 'Candy' },
  { companyName: 'Alexandria confectionary (Corona)', contactName: 'Remon', contactPosition: '', phone: '01201222150', email: '', category: 'Candy' },
  { companyName: 'Swifax', contactName: 'Ahmed Mahmoud', contactPosition: '', phone: '1211112051', email: '', category: 'Other' },
  { companyName: 'Shelter Investment Group', contactName: 'Caroline Fahim', contactPosition: '', phone: '201020804724', email: '', category: 'Other Tobacco' },
  { companyName: 'Flo water', contactName: 'Multiple contacts', contactPosition: '', phone: '01270135395', email: '', category: 'Package Beverage' },
  { companyName: 'Live Long for Import & Export & Supply', contactName: 'Nada / Naguib', contactPosition: '', phone: '1223005447', email: '', category: 'Other' },
  { companyName: 'Cairo 3A', contactName: 'Mohamed Abdallah', contactPosition: '', phone: '1099113637', email: '', category: 'Fruits & veg' },
  { companyName: 'PET', contactName: 'Ezz', contactPosition: '', phone: '1281437764', email: '', category: 'Plastics' },
  { companyName: 'El-Amir for Commercial Agencies', contactName: 'Mahmoud / Mohamed', contactPosition: '', phone: '01096029102', email: '', category: 'Salty Snacks' },
  { companyName: 'Bloom', contactName: 'abdallah elsayed', contactPosition: '', phone: '0109 5239110', email: 'sales@crush-monster.com', category: 'Salty Snacks' },
  { companyName: 'Senyorita for food industries', contactName: 'Mohamed Bahnasy', contactPosition: '', phone: '1283222201', email: '', category: 'Salty Snacks' },
  { companyName: 'Pyramid Poultry', contactName: 'Mahmoud Hemida', contactPosition: '', phone: '1001859536', email: '', category: 'Raw Material' },
  { companyName: 'Emad Lotfy Company', contactName: 'Mohamed', contactPosition: '', phone: '1111715398', email: '', category: 'Other' },
  { companyName: 'Willy Group', contactName: 'Amir', contactPosition: '', phone: '1111816333', email: '', category: 'AutoMotive' },
  { companyName: 'Glory Trading', contactName: 'Mahmoud', contactPosition: '', phone: '1222288312', email: '', category: 'Candy' },
  { companyName: 'Hectare Group', contactName: 'norhan / Asmaa', contactPosition: '', phone: '1120840642', email: '', category: 'Salty Snacks' },
  { companyName: 'Itamco for Agriculture Development', contactName: 'Abd El Kader', contactPosition: '', phone: '1283333021', email: '', category: 'Other' },
  { companyName: 'El tanbouli for packing', contactName: 'Badea / Hamada / Ayman', contactPosition: '', phone: '1221845370', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Egybros for food industry', contactName: 'Ahmed', contactPosition: '', phone: '1094444907', email: '', category: 'Other' },
  { companyName: 'EgySwiss Food Company', contactName: 'Mohamed', contactPosition: '', phone: '1147777531', email: '', category: 'Other' },
  { companyName: 'Khoshala for industry & trading Co', contactName: 'Michael', contactPosition: '', phone: '1064005366', email: '', category: 'Other' },
  { companyName: 'Al Mansour AL Dawleya for Distribution', contactName: 'Walid', contactPosition: '', phone: '1002189130', email: '', category: 'Other' },
  { companyName: 'El Hayat For Supplies', contactName: 'Mohamed Ali', contactPosition: '', phone: '1281820011', email: '', category: 'Other' },
  { companyName: 'Smiley\'s Food Indistries', contactName: 'Adel', contactPosition: '', phone: '1006018631', email: '', category: 'Other' },
  { companyName: 'The Egyptian company for manufacturing sweets & snacks (Meringo)', contactName: 'Mostafa', contactPosition: '', phone: '1033966327', email: '', category: 'Candy' },
  { companyName: 'El Tahan', contactName: 'Ahmed', contactPosition: '', phone: '01000203794', email: '', category: 'Package Sweet Snacks' },
  { companyName: 'Kimbo', contactName: 'Nada', contactPosition: '', phone: '1033335847', email: '', category: 'Other' },
  { companyName: 'Tovan Group', contactName: 'Hossam hamada', contactPosition: '', phone: '1007017033', email: '', category: 'Package Ice Cream' },
  { companyName: 'Meditteraneo Industries', contactName: 'Haitham El Malt', contactPosition: '', phone: '1061354345', email: '', category: 'Barista items' },
  { companyName: 'Misr Pyramids-Crown', contactName: 'Alaa', contactPosition: '', phone: '1223630576', email: '', category: 'General Merchandise' },
  { companyName: 'Tiba Egypt for trade and commercial', contactName: 'Mostafa', contactPosition: '', phone: '1018111988', email: '', category: 'Other' },
  { companyName: 'Interline', contactName: 'Ali', contactPosition: '', phone: '01118531850', email: '', category: 'Candy' },
  { companyName: 'Al Ashraf for trading & Distribution', contactName: 'Mahmoud / Khaled', contactPosition: '', phone: '0 111 363 7123', email: '', category: 'Healthy Beauty Care' },
  { companyName: 'I spark', contactName: 'Malak el awady', contactPosition: 'Public relations responsible', phone: '+20 100 294 4294', email: '', category: 'Other' },
  { companyName: 'AQUA Delta', contactName: 'Mostafa Mohamed', contactPosition: 'National Marketing supervisor', phone: '+20 102 111 0615', email: '', category: 'Other' },
  { companyName: 'to Raw Kettle Cooked Potatoes', contactName: 'Mohamed El Hawari', contactPosition: 'Marketing Manager', phone: '1119879700', email: '', category: 'Other' },
  { companyName: '6', contactName: 'Eslam elshehaby', contactPosition: 'Owner', phone: '1019770779', email: '', category: 'Other' },
  { companyName: 'Bounce box trampoline park', contactName: 'Mahmoud', contactPosition: 'Sales', phone: '+201222204290', email: '', category: 'Other' },
  { companyName: 'Escapology', contactName: 'Escapology', contactPosition: 'Sales', phone: '0106 165 1561', email: '', category: 'Other' },
  { companyName: 'Cupcake studio', contactName: 'Cupcake studio', contactPosition: 'Owner', phone: '+20 112 100 5956', email: '', category: 'Other' },
  { companyName: 'Frozzy twist', contactName: 'Mohamed abo elgendy', contactPosition: 'Owner', phone: '0111 144 4426', email: '', category: 'Other' },
  { companyName: 'Burger king', contactName: 'Ahmed', contactPosition: 'Sales', phone: '+20 101 644 4477', email: '', category: 'Other' },
  { companyName: 'Wild Burger', contactName: 'Mr Hossam', contactPosition: 'Branch Manager', phone: '1092086863', email: '', category: 'Other' },
  { companyName: 'Pegasus travel agency', contactName: 'Ahmed Ashraf', contactPosition: 'marketing manager', phone: '+20 114 188 8557', email: '', category: 'Other' },
  { companyName: 'Megazone&mobimongez', contactName: 'Mr Eslam', contactPosition: 'owner', phone: '+20 101 000 0830', email: '', category: 'Other' },
  { companyName: 'Golden plot', contactName: 'Mr Ali', contactPosition: 'owner', phone: '+20 111 423 4235', email: '', category: 'Other' },
  { companyName: 'Buffalo Burger', contactName: 'Mrs Heba Talaat', contactPosition: 'Vice executive director', phone: '+20 122 232 1717', email: '', category: 'Other' },
  { companyName: 'Room squared coworking place', contactName: 'Ahmed Amer', contactPosition: 'owner', phone: '+20 106 777 4666', email: '', category: 'Other' },
  { companyName: 'Bettycakes', contactName: 'Mr saad Mohamed', contactPosition: 'Owner', phone: '+20 122 110 4141', email: '', category: 'Other' },
  { companyName: 'Zino caffee', contactName: 'Ahmed Aziz', contactPosition: 'Zino trade general manager', phone: '+20 100 845 4545', email: '', category: 'Other' },
  { companyName: 'Busset', contactName: 'NA', contactPosition: 'NA', phone: 'NA', email: '', category: 'Other' },
  { companyName: 'Juhayna (HR)', contactName: 'ibrahim', contactPosition: 'HR', phone: '...', email: '', category: 'Other' },
  { companyName: 'PENLAND', contactName: 'Mohamed Sharaf', contactPosition: 'owner', phone: '+20 100 379 9637', email: '', category: 'Other' },
  { companyName: 'International student identity card', contactName: 'Mr Ahmed', contactPosition: 'Manager', phone: '20 127 574 0911', email: '', category: 'Other' },
  { companyName: 'EG Bank', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'SWVL', contactName: 'Sherif', contactPosition: 'community operation manger', phone: '1065455557', email: '', category: 'Other' },
  { companyName: 'Les Miettes', contactName: 'Mai', contactPosition: 'Owner', phone: '1100444458', email: '', category: 'Other' },
  { companyName: 'Mashroaa El Saada', contactName: 'Hashem Rafaat', contactPosition: 'Founder', phone: '1149491918', email: '', category: 'Other' },
  { companyName: 'Samuel', contactName: 'Samuel', contactPosition: 'Founder', phone: '+20 127 2540761', email: '', category: 'Other' },
  { companyName: 'ENTRADA', contactName: 'Rana Abo Zeid', contactPosition: 'Owner', phone: '1002778272', email: '', category: 'Other' },
  { companyName: 'Laser Craft', contactName: 'Mohamed', contactPosition: 'Owner', phone: '1110146444', email: '', category: 'Other' },
  { companyName: 'Speady Clean', contactName: 'Mohamed', contactPosition: 'Sales director', phone: '1005702772', email: '', category: 'Other' },
  { companyName: 'ISIC International Student Idenity Card', contactName: 'Ahmed', contactPosition: 'Account Manger', phone: '1275740911', email: '', category: 'Other' },
  { companyName: 'Mena Tours', contactName: 'Ali Nasser', contactPosition: 'Borad Member', phone: '1224098424', email: '', category: 'Other' },
  { companyName: 'ESSPRESO LAB', contactName: 'Mohamed el Khashab', contactPosition: 'Sales', phone: '+20 109 794 5200', email: '', category: 'Other' },
  { companyName: 'Glovo', contactName: 'Hassan samir / Mahmood', contactPosition: 'Team leader pd', phone: '1123865898', email: '', category: 'Other' },
  { companyName: 'Travel Line', contactName: 'Doaa', contactPosition: 'Sales', phone: '1012427882', email: '', category: 'Other' },
  { companyName: 'ادرس', contactName: 'mr qaher', contactPosition: 'marketing manager', phone: '1008811250', email: '', category: 'Other' },
  { companyName: 'cls learning solutions', contactName: 'Khaled Mahmoud', contactPosition: 'marketing excutive', phone: '', email: '', category: 'Other' },
  { companyName: 'Up Fuse', contactName: 'N/A', contactPosition: 'N/A', phone: '1002257783', email: '', category: 'Other' },
  { companyName: 'camping gear egy', contactName: 'N/A', contactPosition: 'N/A', phone: '', email: '', category: 'Other' },
  { companyName: 'TBS', contactName: 'Dalia', contactPosition: 'Sales', phone: '1271066277', email: '', category: 'Other' },
  { companyName: 'Nelson', contactName: 'Ahmed Omar', contactPosition: 'Sales', phone: '1157444852', email: '', category: 'Other' },
  { companyName: 'Count', contactName: 'N/A', contactPosition: 'Sales', phone: '1015010722', email: '', category: 'Other' },
  { companyName: 'Cadbury', contactName: 'Sherine / NA', contactPosition: 'Sales Director', phone: '1001719414', email: '', category: 'Candy' },
  { companyName: 'Wafflicious', contactName: 'NA', contactPosition: 'NA', phone: '', email: '', category: 'Other' },
  { companyName: 'Chipsy', contactName: 'NA', contactPosition: 'NA', phone: '19063', email: '', category: 'Salty Snacks' },
  { companyName: 'Indomie Egypt', contactName: 'NA', contactPosition: 'NA', phone: '02 23108106', email: '', category: 'Salty Snacks' },
  { companyName: 'Queen\'s Bake', contactName: 'kareem Aboelfetouh', contactPosition: 'Manager', phone: '1282221004', email: '', category: 'Other' },
  { companyName: 'Friends', contactName: 'Mr.Yassin', contactPosition: 'Owner', phone: '0101 101 1184', email: '', category: 'Other' },
  { companyName: 'Free Day', contactName: 'Mohamed Sherif', contactPosition: 'Owner', phone: '0109 001 8858', email: '', category: 'Other' },
  { companyName: 'Taster', contactName: 'Sayed elsheihk', contactPosition: 'Owner', phone: '0 109 085 8408', email: '', category: 'Other' },
  { companyName: 'Davinci', contactName: 'Mohamed Sobhy', contactPosition: 'Owner', phone: '0 100 454 2556', email: '', category: 'Other' },
  { companyName: 'Daily Dose', contactName: 'Mohamed Osman', contactPosition: 'Owner', phone: '1032126600', email: '', category: 'Other' },
  { companyName: 'El Helaly optics', contactName: 'Mohamed elfeky', contactPosition: 'PR', phone: '1000025616', email: '', category: 'Other' },
  { companyName: 'Embaby Pharmacy', contactName: 'Omar Elembaby', contactPosition: 'pharmacy owner', phone: '1101012342', email: '', category: 'Other' },
  { companyName: 'Doria cafe', contactName: 'Mr.Hamada', contactPosition: 'Owner', phone: '1007776557', email: '', category: 'Other' },
  { companyName: 'Boulevard', contactName: 'Mohammed Ibrahim', contactPosition: 'Manager', phone: '20502200896', email: '', category: 'Other' },
  { companyName: 'Moods', contactName: 'Ahmed nashaat', contactPosition: 'Manager', phone: '502227333', email: '', category: 'Other' },
  { companyName: 'Cleaver', contactName: 'Mohammed Sobhy', contactPosition: 'General Manager', phone: '1008044884', email: '', category: 'Other' },
  { companyName: 'Space', contactName: 'Mr.Ibrahim', contactPosition: 'Owner', phone: '1069613751', email: '', category: 'Other' },
  { companyName: 'Booking Tours', contactName: 'Mrs.Nour', contactPosition: 'PR', phone: '1021121289', email: '', category: 'Other' },
  { companyName: 'Ecta', contactName: 'Mr.Farid', contactPosition: 'Manager', phone: '1023699313', email: '', category: 'Other' },
  { companyName: 'Dokant el s3ada', contactName: 'Mohamed Shabaan', contactPosition: 'Manager', phone: '1098619871', email: '', category: 'Other' },
  { companyName: 'Icon center', contactName: 'Mohammed Elsayed', contactPosition: 'Manager', phone: '1010165165', email: '', category: 'Other' },
  { companyName: 'Cambridge center', contactName: 'Ayman', contactPosition: 'Manager', phone: '0 100 901 7833', email: '', category: 'Other' },
  { companyName: 'Blue cafe', contactName: 'kerolos', contactPosition: 'Manager', phone: '1029380000', email: '', category: 'Other' },
  { companyName: 'Books and beans', contactName: 'Ashraf wagdy', contactPosition: 'Owner', phone: '1001084084', email: '', category: 'Other' },
  { companyName: 'New Horizon', contactName: 'Mostafa El Masry', contactPosition: 'Owner', phone: '1066610442', email: '', category: 'Other' },
  { companyName: 'Square Workspace', contactName: 'Mrs.Asmaa', contactPosition: 'Owner', phone: '1015551964', email: '', category: 'Other' },
  { companyName: 'Fit&Fresh', contactName: 'Mahmoud amir', contactPosition: 'Owner', phone: '1098987071', email: '', category: 'Other' },
  { companyName: 'Celia Cafe', contactName: 'Mahmoud abdelaziz', contactPosition: 'Manager', phone: '1007636373', email: '', category: 'Other' },
  { companyName: 'Book Juice', contactName: 'Mr.sakr', contactPosition: 'Owner', phone: '1060502110', email: '', category: 'Other' },
  { companyName: 'Jii Fitness', contactName: 'Mrs.salwa', contactPosition: 'Manager', phone: '1011199322', email: '', category: 'Other' },
  { companyName: 'Boo studios', contactName: 'abdulrahman mohamed', contactPosition: 'Owner', phone: '1000167223', email: '', category: 'Other' },
  { companyName: 'mohab elseginy photography', contactName: 'Mohab El segini', contactPosition: 'Owner', phone: '1026009085', email: '', category: 'Other' },
  { companyName: 'Alternative Education', contactName: 'Nada Al Amrousy', contactPosition: 'Owner', phone: '1010760767', email: '', category: 'Other' },
  { companyName: 'Stone Yard', contactName: 'Ahmed Samir', contactPosition: 'Co-owner', phone: '1009969288', email: '', category: 'Other' },
  { companyName: 'chocaine', contactName: 'Ahmed gamal', contactPosition: 'Owner', phone: '1023272025', email: '', category: 'Other' },
  { companyName: 'cheers', contactName: 'mr mahmoud', contactPosition: 'Sales', phone: '1121508055', email: '', category: 'Other' },
  { companyName: 'The Edge Lounge', contactName: 'Eslam Abbas', contactPosition: 'Manager', phone: '1022688660', email: '', category: 'Other' },
  { companyName: 'Tree cafe', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Pesto', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Grand Optics', contactName: 'ahmed ashraf', contactPosition: 'Owner', phone: '1095750515', email: '', category: 'Other' },
  { companyName: 'Rosemary', contactName: 'Mohamed abdelhady', contactPosition: 'Owner', phone: '1067518382', email: '', category: 'Other' },
  { companyName: 'Trend workspace', contactName: 'mr wael', contactPosition: 'Owner', phone: '1007576252', email: '', category: 'Other' },
  { companyName: 'Civa / girls cafe', contactName: 'mohamed tarek', contactPosition: 'Owner', phone: '1026046849', email: '', category: 'Other' },
  { companyName: 'Mansoura Students\' Scientific Association', contactName: 'Mostafa Nasser', contactPosition: 'Externa affairs', phone: '109492404', email: '', category: 'Other' },
  { companyName: 'target team', contactName: 'elnahy', contactPosition: 'Co-Founder', phone: '1015939449', email: '', category: 'Other' },
  { companyName: 'Coffeeshop Company', contactName: 'Gamal Matter', contactPosition: 'Manager', phone: '1001266941', email: '', category: 'Other' },
  { companyName: 'Manhattan Cafe', contactName: 'Mr.ESlam', contactPosition: 'Operations Manager', phone: '1005435884', email: '', category: 'Other' },
  { companyName: 'ALnakity Silver', contactName: 'Ahmed elnkety', contactPosition: 'Manager', phone: '1067091111', email: '', category: 'Other' },
  { companyName: 'Novita Wprkspace', contactName: 'Mohamed Omara', contactPosition: 'Co-Owner', phone: '1004245870', email: '', category: 'Other' },
  { companyName: 'Camp For english', contactName: 'mohamed Zahran', contactPosition: 'PR', phone: '201067573114', email: '', category: 'Other' },
  { companyName: 'Groovy', contactName: 'Habiba', contactPosition: 'Owner', phone: '1092277083', email: '', category: 'Other' },
  { companyName: 'Bremer', contactName: 'Mr.Reda', contactPosition: 'Owner', phone: '1007776557', email: '', category: 'Other' },
  { companyName: 'Estilo De Vida', contactName: 'Ahmed Gamal', contactPosition: 'Owner', phone: '1007703173', email: '', category: 'Other' },
  { companyName: 'Fidel Castro Cafe', contactName: 'Muhammed AbdElrazek', contactPosition: 'Manager', phone: '1023699313', email: '', category: 'Other' },
  { companyName: 'Pen and paper', contactName: 'Youmna sheta', contactPosition: 'PR', phone: '502200184', email: '', category: 'Other' },
  { companyName: 'Kadri el ghetani', contactName: 'Ehab elghitany', contactPosition: 'Owner', phone: '1092875208', email: '', category: 'Other' },
  { companyName: 'Cold stone', contactName: 'Mr.Allam', contactPosition: 'Owner', phone: '1116057403', email: '', category: 'Other' },
  { companyName: 'Pluto', contactName: 'Ahmed amgad', contactPosition: 'Manager', phone: '1061765555', email: '', category: 'Other' },
  { companyName: 'Elghamry Gym', contactName: 'Muhammed El Ghamry', contactPosition: 'General Manager & Owner', phone: '1061717017', email: '', category: 'Other' },
  { companyName: 'Opaa', contactName: 'Mr.Ashraf', contactPosition: '...', phone: '1068222643', email: '', category: 'Other' },
  { companyName: 'Shashlik', contactName: 'mr Eslam', contactPosition: 'Manager', phone: '1090460020', email: '', category: 'Other' },
  { companyName: 'Dounatela', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Sydney Cafe & Resturant', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Holmes burger Mansoura', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Cold stone Creamery Mansoura', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'spin Shawema', contactName: 'mr.tarek', contactPosition: 'manager', phone: '1099641310', email: '', category: 'Other' },
  { companyName: 'Caizo', contactName: '', contactPosition: '', phone: '1050009023', email: '', category: 'Other' },
  { companyName: 'Sauce', contactName: 'mr mahmoud', contactPosition: 'Manager', phone: '1022807375', email: '', category: 'Other' },
  { companyName: 'Doulato', contactName: 'Fatma Adel', contactPosition: 'manager', phone: '1007050326', email: '', category: 'Other' },
  { companyName: 'Boba Bear', contactName: 'Ahmed Awad', contactPosition: 'Manager', phone: '1014570490', email: '', category: 'Other' },
  { companyName: 'BRGR', contactName: 'Ahmed Said', contactPosition: 'Manager', phone: '1274124232', email: '', category: 'Other' },
  { companyName: 'big Daddy', contactName: 'Emad', contactPosition: 'Manager', phone: '1062646667', email: '', category: 'Other' },
  { companyName: 'Heart Attack', contactName: 'Mr kareem', contactPosition: 'manager', phone: '1125232303', email: '', category: 'Other' },
  { companyName: 'tako amigos', contactName: 'hana', contactPosition: 'manager', phone: '1201125925', email: '', category: 'Other' },
  { companyName: 'pizza station', contactName: 'mrs dalia / hatem hassan', contactPosition: 'manager', phone: '1102896815', email: '', category: 'Other' },
  { companyName: 'moiche', contactName: 'moustafa abdallah', contactPosition: 'manager', phone: '1126815805', email: '', category: 'Other' },
  { companyName: 'ghamer trips', contactName: 'amen abouelela', contactPosition: 'owner', phone: '01010611749', email: '', category: 'Other' },
  { companyName: '27', contactName: 'Abdallah saleh', contactPosition: 'owner', phone: '1008594458', email: '', category: 'Other' },
  { companyName: 'balance gym', contactName: 'abdelshafy', contactPosition: 'manager', phone: '1101130102', email: '', category: 'Other' },
  { companyName: 'Adranline', contactName: 'abdelwahab', contactPosition: 'manager', phone: '1281264007', email: '', category: 'Other' },
  { companyName: 'mini sou', contactName: 'abdo', contactPosition: 'manager', phone: '1098842634', email: '', category: 'Other' },
  { companyName: 'yalla hagz', contactName: 'ahmed amin', contactPosition: 'owner', phone: '1117775978', email: '', category: 'Other' },
  { companyName: 'British Embassy', contactName: 'haneen shaheen', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'noon academy', contactName: 'ahmed', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'goodsmart', contactName: 'amr fawzi', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'HERS', contactName: 'lamia', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'AXA', contactName: 'yasmina', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'rizkallaco', contactName: 'mary', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'uniliver', contactName: 'yasmine', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Muhammed Mohsen', contactName: 'Hilton', contactPosition: '', phone: '1028984439', email: '', category: 'Other' },
  { companyName: 'Heba Said', contactName: 'Amanda', contactPosition: '', phone: '1000770798', email: '', category: 'Other' },
  { companyName: 'Ahmad Hamdy/ Rana', contactName: 'Otlob', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Rana Tarek', contactName: 'Jumia', contactPosition: '', phone: '0 109 323 3808', email: '', category: 'Other' },
  { companyName: 'ValU', contactName: 'Omar Gamal', contactPosition: '', phone: '0 122 538 4506', email: '', category: 'Other' },
  { companyName: 'Carriage', contactName: 'Ahmed Radi', contactPosition: '', phone: '1116911100', email: '', category: 'Other' },
  { companyName: 'Misr pharmacy', contactName: 'ola', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Nada Mohsen', contactName: 'Aramex', contactPosition: '', phone: '1000510274', email: '', category: 'Other' },
  { companyName: 'Ashraf Kamal', contactName: 'H2O GYM', contactPosition: '', phone: '1067995979', email: '', category: 'Other' },
  { companyName: 'Gold\'s Gym', contactName: '', contactPosition: '', phone: '1000876422', email: '', category: 'Other' },
  { companyName: 'Transformers fitness center Maddi', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Steel Fitness Club Egypt', contactName: '', contactPosition: '', phone: '1010566661', email: '', category: 'Other' },
  { companyName: 'Club 7', contactName: '', contactPosition: '', phone: '1204051117', email: '', category: 'Other' },
  { companyName: 'InShape Clinic', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'The Body Shop', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Nefertari', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: '19011 pharmacy', contactName: 'dr maysa', contactPosition: '', phone: '1002304229', email: '', category: 'Other' },
  { companyName: 'seif pharmacies', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'kidzania', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'marketchino', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Lord & Berry', contactName: 'sara shawky', contactPosition: '', phone: '1091921340', email: '', category: 'Other' },
  { companyName: 'Hefny Pharma Group', contactName: 'Marwa Mokhtar', contactPosition: '', phone: '1021799952', email: '', category: 'Other' },
  { companyName: 'unicharm', contactName: 'nada', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'mountain view', contactName: 'mariam', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'samsung', contactName: 'ali', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'kelloggtolaram', contactName: 'nesreen', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'EFG', contactName: 'asser', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Matjar', contactName: 'alia', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Motoon', contactName: 'Norhan', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Colorx', contactName: 'salma', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Breadfast', contactName: 'tehia', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Et3raf', contactName: 'shimaa', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Bertliz', contactName: 'nouhan', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'net impact hub', contactName: 'shimaa', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'chefaa', contactName: 'ola', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Eskai', contactName: 'samar selim', contactPosition: '', phone: '1120663322', email: '', category: 'Other' },
  { companyName: 'Menna Reihan', contactName: '', contactPosition: '', phone: '1112905556', email: '', category: 'Other' },
  { companyName: 'karim ebeied', contactName: '', contactPosition: '', phone: '1287812812', email: '', category: 'Other' },
  { companyName: 'stick top', contactName: 'mohamed dorgham', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'discounti', contactName: 'reem safwat', contactPosition: '', phone: '1205255369', email: '', category: 'Other' },
  { companyName: 'creative hub', contactName: 'hadeer', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Golw', contactName: 'Amna', contactPosition: '', phone: '201005497979', email: '', category: 'Other' },
  { companyName: 'Valu', contactName: 'Omar', contactPosition: '', phone: '201225384506', email: '', category: 'Other' },
  { companyName: 'Kidzania', contactName: 'Yasmeen Nasser', contactPosition: '', phone: '1281041044', email: '', category: 'Other' },
  { companyName: 'Nile Air', contactName: 'Ahmed Fayez', contactPosition: '', phone: '1032580189', email: '', category: 'Other' },
  { companyName: 'El-Setat market', contactName: '', contactPosition: '', phone: '1220030303', email: '', category: 'Other' },
  { companyName: 'Allianz', contactName: 'Rana.mourad@allianz.com.eg', contactPosition: '', phone: '1155108804', email: '', category: 'Other' },
  { companyName: 'Heal counseling', contactName: 'Noha EL-Nahas', contactPosition: '', phone: '1110544884', email: '', category: 'Other' },
  { companyName: 'Etisalat', contactName: 'Sara Adel', contactPosition: '', phone: '0 111 050 3030', email: '', category: 'Other' },
  { companyName: 'Etisalat PR', contactName: 'Sherifa El Mofty', contactPosition: '', phone: '0 110 000 0610', email: '', category: 'Other' },
  { companyName: 'Ahmed Helmy', contactName: 'Stylish Eve', contactPosition: '', phone: '0 111 111 4313', email: '', category: 'Other' },
  { companyName: 'Shahir Raslan', contactName: 'msarslan@ariika.com', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Natali', contactName: 'Sofi', contactPosition: '', phone: '0 122 221 1371', email: '', category: 'Other' },
  { companyName: 'Reham Nasser', contactName: 'reham.nasser@teenpreneurs.net', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'TNT', contactName: 'Amr Essam', contactPosition: '', phone: '1067027638', email: '', category: 'Other' },
  { companyName: 'Marsol', contactName: 'Osama Harfoush', contactPosition: '', phone: '1150331132', email: '', category: 'Other' },
  { companyName: '7keema', contactName: '7keema', contactPosition: '', phone: '1016464676', email: '', category: 'Other' },
  { companyName: 'WE / telecom egypt', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'Vodafone', contactName: '', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'watch it', contactName: 'ayah osama', contactPosition: '', phone: '1004379367', email: '', category: 'Other' },
  { companyName: 'GESR', contactName: 'salma', contactPosition: '', phone: '1021144481', email: '', category: 'Other' },
  { companyName: 'johnson', contactName: 'morouh', contactPosition: '', phone: '1008857886', email: '', category: 'Other' },
  { companyName: 'injaz', contactName: 'rania elgammal / ahmed abdelaziz', contactPosition: '', phone: '', email: '', category: 'Other' },
  { companyName: 'you think green', contactName: 'nadiene', contactPosition: '', phone: '1033771644', email: '', category: 'Other' },
  { companyName: 'Rizkalla', contactName: 'Marie sami', contactPosition: '', phone: '1208797979', email: '', category: 'Other' },
  { companyName: 'Raseedi', contactName: 'samual', contactPosition: '', phone: '1227007299', email: '', category: 'Other' },
  { companyName: 'sofy', contactName: 'natali', contactPosition: '', phone: '1222211371', email: '', category: 'Other' },
  { companyName: 'Henkel', contactName: 'salma azhary', contactPosition: '', phone: '1005502685', email: '', category: 'Other' },
  { companyName: 'Andalusia', contactName: 'Mandy Maged', contactPosition: '', phone: '1069110582', email: '', category: 'Other' },
  { companyName: 'GEMS egypt schools', contactName: 'nada', contactPosition: '', phone: '1114045671', email: '', category: 'Other' },
];

export default function ContactsPage() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [activeDeals, setActiveDeals] = useState([]);
  const [closedDeals, setClosedDeals] = useState([]); // Track deal history
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [teamContext, setTeamContext] = useState({ teamId: null, teamName: null });
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityTab, setQualityTab] = useState('duplicates');
  const [mergingGroupId, setMergingGroupId] = useState(null);

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    contactPosition: '',
    phone: '',
    email: '',
    category: 'Other',
    notes: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      loadContacts();
      loadTeamContext();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPipeline = async () => {
      const stages = await fetchPipelineSettings();
      setPipelineStages(stages);
    };
    loadPipeline();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadActiveDeals();
      loadDealHistory();
    }
  }, [currentUser, pipelineStages, teamContext.teamId]);

  async function loadContacts() {
    try {
      setLoading(true);
      const contactsQuery = query(
        collection(db, 'contacts'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(contactsQuery);
      const allContacts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setContacts(allContacts);
    } catch (e) {
      console.error('Error loading contacts:', e);
      alert('Failed to load contacts: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamContext() {
    try {
      let teamId = currentUser?.teamId || null;
      let teamName = currentUser?.teamName || null;

      if (!teamId && userRole === 'team_leader') {
        const teamSnap = await getDocs(
          query(collection(db, 'teams'), where('leaderId', '==', currentUser.uid))
        );
        const teamDoc = teamSnap.docs[0];
        if (teamDoc) {
          teamId = teamDoc.id;
          teamName = teamDoc.data().name || null;
        }
      }

      if (!teamId && userRole !== 'team_leader') {
        const memberSnap = await getDocs(
          query(collection(db, 'teamMembers'), where('userId', '==', currentUser.uid))
        );
        const memberDoc = memberSnap.docs[0];
        if (memberDoc) {
          teamId = memberDoc.data().teamId || null;
        }
        if (teamId && !teamName) {
          const teamRef = doc(db, 'teams', teamId);
          const teamSnap = await getDoc(teamRef);
          if (teamSnap.exists()) {
            teamName = teamSnap.data().name || null;
          }
        }
      }

      setTeamContext({ teamId, teamName });
    } catch (error) {
      console.error('Error loading team context:', error);
      setTeamContext({ teamId: null, teamName: null });
    }
  }

  async function fetchAccessibleDeals() {
    if (userRole === 'admin' || userRole === 'sales_manager') {
      const snap = await getDocs(collection(db, 'sales'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    const queries = [
      query(collection(db, 'sales'), where('ownerId', '==', currentUser.uid)),
      query(collection(db, 'sales'), where('createdBy', '==', currentUser.uid)),
      query(collection(db, 'sales'), where('sharedWith', 'array-contains', currentUser.uid))
    ];

    if (teamContext.teamId) {
      queries.push(query(collection(db, 'sales'), where('teamId', '==', teamContext.teamId)));
    }

    const snapshots = await Promise.all(queries.map(q => getDocs(q)));
    const dealMap = new Map();
    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(docSnap => {
        dealMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
    });

    return Array.from(dealMap.values());
  }

  async function loadActiveDeals() {
    try {
      const activeStages = pipelineStages
        .map(stage => stage.value)
        .filter(value => !PIPELINE_RESERVED_VALUES.includes(value));

      if (activeStages.length === 0) {
        setActiveDeals([]);
        return;
      }

      const deals = await fetchAccessibleDeals();
      const activeDealsList = deals.filter(deal => activeStages.includes(deal.status));
      setActiveDeals(activeDealsList);
    } catch (e) {
      console.error('Error loading active deals:', e);
    }
  }

  async function loadDealHistory() {
    try {
      const deals = await fetchAccessibleDeals();
      const closed = deals.filter(deal => deal.status === 'closed' || deal.status === 'lost');
      setClosedDeals(closed);
    } catch (e) {
      console.error('Error loading deal history:', e);
    }
  }

  function isContactInProgress(contact) {
    return activeDeals.some(deal => 
      deal.sourceContactId === contact.id || 
      (deal.businessName?.toLowerCase() === contact.companyName?.toLowerCase() && 
       deal.phoneNumber === contact.phone)
    );
  }

  function getWorkingUser(contact) {
    const deal = activeDeals.find(deal => 
      deal.sourceContactId === contact.id || 
      (deal.businessName?.toLowerCase() === contact.companyName?.toLowerCase() && 
       deal.phoneNumber === contact.phone)
    );
    return deal ? (deal.ownerName || deal.createdByName) : null;
  }

  // Get deal history for a contact
  function getDealHistory(contact) {
    return closedDeals.filter(deal => 
      deal.sourceContactId === contact.id || 
      (deal.businessName?.toLowerCase() === contact.companyName?.toLowerCase() && 
       deal.phoneNumber === contact.phone)
    );
  }

  async function createContact(e) {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'contacts'), {
        ...form,
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        createdAt: serverTimestamp()
      });
      
      setForm({
        companyName: '',
        contactName: '',
        contactPosition: '',
        phone: '',
        email: '',
        category: 'Other',
        notes: ''
      });
      setShowForm(false);
      loadContacts();
      alert('Contact created successfully!');
    } catch (e) {
      console.error('Error creating contact:', e);
      alert('Failed to create contact: ' + e.message);
    }
  }

  async function saveEdit() {
    try {
      const contactRef = doc(db, 'contacts', editContact.id);
      
      // Check if contact is in progress - if so, protect phone and email
      if (isContactInProgress(editContact)) {
        // Get original contact data
        const originalContact = contacts.find(c => c.id === editContact.id);
        
        // Restore protected fields to original values
        await updateDoc(contactRef, {
          companyName: editContact.companyName,
          contactName: editContact.contactName,
          contactPosition: editContact.contactPosition,
          phone: originalContact.phone, // PROTECTED - cannot change
          email: originalContact.email, // PROTECTED - cannot change
          category: editContact.category,
          notes: editContact.notes
        });
        
        alert('✅ Contact updated!\n\n⚠️ Note: Phone and email are protected while a deal is active and were not changed.');
      } else {
        // No active deal - allow all changes
        await updateDoc(contactRef, {
          companyName: editContact.companyName,
          contactName: editContact.contactName,
          contactPosition: editContact.contactPosition,
          phone: editContact.phone,
          email: editContact.email,
          category: editContact.category,
          notes: editContact.notes
        });
        
        alert('Contact updated successfully!');
      }

      setEditContact(null);
      loadContacts();
    } catch (e) {
      console.error('Error updating contact:', e);
      alert('Failed to update contact: ' + e.message);
    }
  }

  async function deleteContact(id) {
    if (userRole !== 'admin') {
      alert('⚠️ Only administrators can delete contacts.');
      return;
    }
    
    if (!window.confirm('⚠️ Delete this contact permanently?')) return;
    try {
      await deleteDoc(doc(db, 'contacts', id));
      loadContacts();
      alert('Contact deleted successfully!');
    } catch (e) {
      console.error('Error deleting contact:', e);
      alert('Failed to delete contact: ' + e.message);
    }
  }

  async function startWorkingOnContact(contact) {
    if (isContactInProgress(contact)) {
      const workingUser = getWorkingUser(contact);
      alert(`⚠️ This contact is already being worked on by ${workingUser}.\n\nYou cannot start a new deal for this contact until the current deal is closed or marked as lost.`);
      return;
    }

    if (!window.confirm(`Start working on ${contact.companyName}?\n\nThis will create a sales deal and lock this contact so others can't work on it simultaneously.`)) return;
    
    try {
      const defaultStage = pipelineStages[0]?.value || 'potential_client';
      await addDoc(collection(db, 'sales'), {
        businessName: contact.companyName,
        contactPerson: contact.contactName,
        phoneNumber: contact.phone,
        status: defaultStage,
        price: 0,
        notes: `Category: ${contact.category}\nEmail: ${contact.email || 'N/A'}\nPosition: ${contact.contactPosition || 'N/A'}\n\nOriginal Notes: ${contact.notes || 'None'}`,
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        ownerId: currentUser.uid,
        ownerName: `${currentUser.firstName} ${currentUser.lastName}`,
        teamId: teamContext.teamId || null,
        teamName: teamContext.teamName || null,
        sharedWith: [],
        archived: false,
        sourceContactId: contact.id,
        createdAt: serverTimestamp(),
        statusUpdatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        editHistory: []
      });

      await loadActiveDeals();
      
      alert(`✅ Deal created successfully!\n\n${contact.companyName} is now locked to you. Others cannot start working on this contact until you close or lose the deal.`);
      navigate('/sales/deals');
    } catch (e) {
      console.error('Error starting work on contact:', e);
      alert('Failed to start working on contact: ' + e.message);
    }
  }

  async function importAllContacts() {
    if (!window.confirm(`Import ${FULL_CONTACT_LIST.length} contacts?\n\nThis will add all contacts that don't already exist in your database.`)) return;
    
    setImporting(true);
    try {
      let imported = 0;
      let failed = 0;
      let skipped = 0;
      
      const existingSnapshot = await getDocs(collection(db, 'contacts'));
      const existingCompanies = new Set(
        existingSnapshot.docs.map(d => d.data().companyName?.toLowerCase())
      );
      
      const batchSize = 10;
      for (let i = 0; i < FULL_CONTACT_LIST.length; i += batchSize) {
        const batch = FULL_CONTACT_LIST.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (contact) => {
          try {
            if (existingCompanies.has(contact.companyName?.toLowerCase())) {
              skipped++;
              return;
            }
            
            await addDoc(collection(db, 'contacts'), {
              ...contact,
              notes: '',
              createdBy: currentUser.uid,
              createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
              createdAt: serverTimestamp()
            });
            imported++;
          } catch (e) {
            failed++;
            console.error(`Failed to import ${contact.companyName}:`, e);
          }
        }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setShowImport(false);
      loadContacts();
      alert(`✅ Import complete!\n\n✅ Imported: ${imported}\n⏭️ Skipped (already exist): ${skipped}\n❌ Failed: ${failed}\n\nTotal processed: ${FULL_CONTACT_LIST.length}`);
    } catch (e) {
      console.error('Error importing contacts:', e);
      alert('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  }

  const canMergeDuplicates = userRole === 'admin' || userRole === 'sales_manager';

  async function mergeDuplicateGroup(group) {
    if (!group || !group.contacts || group.contacts.length < 2) return;
    if (!canMergeDuplicates) {
      alert('Only admins or sales managers can merge duplicates.');
      return;
    }

    const primary = group.contacts.find(c => c.id === group.primaryId) || group.contacts[0];
    const others = group.contacts.filter(c => c.id !== primary.id);
    if (others.length === 0) return;

    if (!window.confirm(`Merge ${others.length} duplicate contact(s) into "${primary.companyName || primary.contactName || 'Primary'}"?`)) {
      return;
    }

    setMergingGroupId(group.id);
    try {
      const { id: primaryId, ...primaryData } = primary;
      const merged = { ...primaryData };
      const fields = ['companyName', 'contactName', 'contactPosition', 'phone', 'email', 'category'];

      fields.forEach(field => {
        if (!normalizeText(merged[field])) {
          const candidate = others.find(contact => normalizeText(contact[field]));
          if (candidate) merged[field] = candidate[field];
        }
      });

      const notesParts = [];
      if (primary.notes) notesParts.push(primary.notes);
      others.forEach(contact => {
        if (contact.notes) {
          const label = contact.companyName || contact.contactName || 'Contact';
          notesParts.push(`Merged from ${label}: ${contact.notes}`);
        }
      });
      merged.notes = notesParts.filter(Boolean).join('\n\n');

      const mergedFromIds = others.map(contact => contact.id);
      const updatePayload = {
        ...merged,
        updatedAt: serverTimestamp(),
        mergedAt: serverTimestamp()
      };

      if (mergedFromIds.length > 0) {
        updatePayload.mergedFrom = arrayUnion(...mergedFromIds);
      }

      await updateDoc(doc(db, 'contacts', primaryId), updatePayload);

      const relatedDeals = [...activeDeals, ...closedDeals]
        .filter(deal => mergedFromIds.includes(deal.sourceContactId));
      await Promise.all(
        relatedDeals.map(deal =>
          updateDoc(doc(db, 'sales', deal.id), {
            sourceContactId: primaryId,
            updatedAt: serverTimestamp()
          })
        )
      );

      await Promise.all(others.map(contact => deleteDoc(doc(db, 'contacts', contact.id))));

      await loadContacts();
      await loadActiveDeals();
      await loadDealHistory();
      alert('Duplicates merged successfully!');
    } catch (error) {
      console.error('Error merging duplicates:', error);
      alert('Failed to merge duplicates: ' + error.message);
    } finally {
      setMergingGroupId(null);
    }
  }

  const filtered = contacts.filter(c => {
    const searchMatch = 
      c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase());
    
    const categoryMatch = categoryFilter === 'all' || c.category === categoryFilter;
    
    return searchMatch && categoryMatch;
  });

  const categoryCounts = contacts.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const missingContacts = useMemo(
    () => contacts.filter(contact =>
      REQUIRED_CONTACT_FIELDS.some(field => !normalizeText(contact[field]))
    ),
    [contacts]
  );

  const duplicateGroups = useMemo(() => {
    const buildGroups = (type, keyFn) => {
      const map = new Map();
      contacts.forEach(contact => {
        const key = keyFn(contact);
        if (!key) return;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(contact);
      });

      return Array.from(map.entries())
        .filter(([, list]) => list.length > 1)
        .map(([key, list]) => {
          const sorted = [...list].sort((a, b) => {
            const scoreDiff = getContactQualityScore(b) - getContactQualityScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });
          return {
            id: `${type}:${key}`,
            type,
            key,
            contacts: list,
            primaryId: sorted[0]?.id
          };
        });
    };

    const emailGroups = buildGroups('Email', contact => {
      const key = normalizeText(contact.email);
      return key && key.includes('@') ? key : null;
    });

    const phoneGroups = buildGroups('Phone', contact => {
      const key = normalizePhone(contact.phone);
      return key && key.length >= 7 ? key : null;
    });

    const companyGroups = buildGroups('Company', contact => {
      const key = normalizeText(contact.companyName);
      return key && key.length >= 3 ? key : null;
    });

    return [...emailGroups, ...phoneGroups, ...companyGroups];
  }, [contacts]);

  const availableContacts = filtered.filter(c => !isContactInProgress(c));
  const inProgressContacts = filtered.filter(c => isContactInProgress(c));

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            Contact Directory
          </h1>
          <p className="text-gray-600 mt-1 ml-15">
            Manage your business contacts and convert them to sales opportunities
          </p>
        </div>

        <div className="flex gap-3">
          {(userRole === 'admin' || userRole === 'sales_manager') && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 hover:scale-105"
            >
              <Upload size={20} strokeWidth={2.5} />
              <span>Import Contacts</span>
            </button>
          )}
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 hover:scale-105"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>Add New Contact</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Total Contacts" value={contacts.length} icon={Users} color="purple" />
        <StatCard title="Available" value={availableContacts.length} icon={CheckCircle2} color="green" />
        <StatCard title="In Progress" value={inProgressContacts.length} icon={Clock} color="yellow" />
        <StatCard title="Categories" value={Object.keys(categoryCounts).length} icon={Building2} color="blue" />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search contacts by name, company, email, or phone..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat} {categoryCounts[cat] ? `(${categoryCounts[cat]})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(search || categoryFilter !== 'all') && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {search && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Category: {categoryFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setCategoryFilter('all')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* DATA QUALITY */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Data Quality Center
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Catch duplicates, missing required fields, and auto-merge suggestions.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => { setQualityTab('duplicates'); setShowQualityModal(true); }}
                className="px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 font-semibold text-sm transition-all"
              >
                Review Duplicates
              </button>
              <button
                onClick={() => { setQualityTab('missing'); setShowQualityModal(true); }}
                className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm transition-all"
              >
                Missing Fields
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-700 uppercase">Duplicate Groups</p>
              <p className="text-2xl font-bold text-purple-700 mt-2">{duplicateGroups.length}</p>
              <p className="text-xs text-purple-600 mt-1">Based on email, phone, and company</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase">Missing Required</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">{missingContacts.length}</p>
              <p className="text-xs text-blue-600 mt-1">Company, contact, or phone</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 uppercase">Auto-Merge Ready</p>
              <p className="text-2xl font-bold text-green-700 mt-2">
                {duplicateGroups.filter(group => group.contacts.length > 1).length}
              </p>
              <p className="text-xs text-green-600 mt-1">Suggested primary contacts available</p>
            </div>
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading contacts...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-6">
            {search || categoryFilter !== 'all' 
              ? 'Try adjusting your filters or search terms' 
              : 'Get started by adding contacts or importing your contact list'}
          </p>
          {!search && categoryFilter === 'all' && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
              >
                Add First Contact
              </button>
              {(userRole === 'admin' || userRole === 'sales_manager') && (
                <button
                  onClick={() => setShowImport(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
                >
                  Import Contacts
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* AVAILABLE CONTACTS */}
      {!loading && availableContacts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Available Contacts ({availableContacts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                dealHistory={getDealHistory(contact)}
                onEdit={() => setEditContact(contact)}
                onDelete={() => deleteContact(contact.id)}
                onStartWorking={() => startWorkingOnContact(contact)}
                userRole={userRole}
                isAvailable={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* IN PROGRESS CONTACTS */}
      {!loading && inProgressContacts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            Currently Being Worked On ({inProgressContacts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                dealHistory={getDealHistory(contact)}
                onEdit={() => setEditContact(contact)}
                onDelete={() => deleteContact(contact.id)}
                onStartWorking={() => startWorkingOnContact(contact)}
                userRole={userRole}
                isAvailable={false}
                workingUser={getWorkingUser(contact)}
              />
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add New Contact">
          <form onSubmit={createContact} className="space-y-4">
            <InputField 
              label="Company Name" 
              icon={Building2} 
              required 
              value={form.companyName} 
              onChange={e => setForm({ ...form, companyName: e.target.value })} 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField 
                label="Contact Person" 
                icon={User} 
                required 
                value={form.contactName} 
                onChange={e => setForm({ ...form, contactName: e.target.value })} 
              />
              <InputField 
                label="Position" 
                icon={Briefcase} 
                value={form.contactPosition} 
                onChange={e => setForm({ ...form, contactPosition: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField 
                label="Phone Number" 
                icon={Phone} 
                required 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
              />
              <InputField 
                label="Email" 
                icon={Mail} 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
              />
            </div>

            <SelectField 
              label="Category" 
              value={form.category} 
              onChange={e => setForm({ ...form, category: e.target.value })} 
              options={CATEGORIES.map(cat => ({ value: cat, label: cat }))} 
            />

            <TextAreaField 
              label="Notes" 
              icon={FileText} 
              value={form.notes} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
            />

            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50"
              >
                Create Contact
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editContact && (
        <Modal onClose={() => setEditContact(null)} title="Edit Contact">
          <div className="space-y-4">
            {isContactInProgress(editContact) && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Protected Fields</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Phone number and email cannot be changed while an active deal exists for this contact.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <InputField 
              label="Company Name" 
              icon={Building2} 
              value={editContact.companyName} 
              onChange={e => setEditContact({ ...editContact, companyName: e.target.value })} 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField 
                label="Contact Person" 
                icon={User} 
                value={editContact.contactName} 
                onChange={e => setEditContact({ ...editContact, contactName: e.target.value })} 
              />
              <InputField 
                label="Position" 
                icon={Briefcase} 
                value={editContact.contactPosition} 
                onChange={e => setEditContact({ ...editContact, contactPosition: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <InputField 
                  label="Phone Number" 
                  icon={Phone} 
                  value={editContact.phone} 
                  onChange={e => setEditContact({ ...editContact, phone: e.target.value })}
                  disabled={isContactInProgress(editContact)}
                />
                {isContactInProgress(editContact) && (
                  <p className="text-xs text-yellow-600 mt-1 ml-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Protected during active deal
                  </p>
                )}
              </div>
              <div>
                <InputField 
                  label="Email" 
                  icon={Mail} 
                  type="email"
                  value={editContact.email} 
                  onChange={e => setEditContact({ ...editContact, email: e.target.value })}
                  disabled={isContactInProgress(editContact)}
                />
                {isContactInProgress(editContact) && (
                  <p className="text-xs text-yellow-600 mt-1 ml-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Protected during active deal
                  </p>
                )}
              </div>
            </div>

            <SelectField 
              label="Category" 
              value={editContact.category} 
              onChange={e => setEditContact({ ...editContact, category: e.target.value })} 
              options={CATEGORIES.map(cat => ({ value: cat, label: cat }))} 
            />

            <TextAreaField 
              label="Notes" 
              icon={FileText} 
              value={editContact.notes || ''} 
              onChange={e => setEditContact({ ...editContact, notes: e.target.value })} 
            />

            <div className="flex gap-3 pt-4">
              <button 
                onClick={saveEdit} 
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditContact(null)} 
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal onClose={() => setShowImport(false)} title="Import All Contacts">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">📋 Import Complete Contact List</p>
              <p className="text-sm text-blue-700 mb-3">
                This will import all {FULL_CONTACT_LIST.length} contacts from your spreadsheet. 
                Contacts that already exist will be skipped to avoid duplicates.
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• {FULL_CONTACT_LIST.length} total contacts to process</li>
                <li>• Duplicate contacts will be automatically skipped</li>
                <li>• Import will take approximately 1-2 minutes</li>
                <li>• All categories and contact information included</li>
              </ul>
            </div>

            {importing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Import in progress...</p>
                  <p className="text-sm text-yellow-700">Please wait, this may take a few moments.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button 
                onClick={importAllContacts} 
                disabled={importing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : `Import ${FULL_CONTACT_LIST.length} Contacts`}
              </button>
              <button 
                onClick={() => setShowImport(false)} 
                disabled={importing}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showQualityModal && (
        <Modal onClose={() => setShowQualityModal(false)} title="Data Quality Center">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setQualityTab('duplicates')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                qualityTab === 'duplicates'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              Duplicates
            </button>
            <button
              onClick={() => setQualityTab('missing')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                qualityTab === 'missing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Missing Fields
            </button>
          </div>

          {qualityTab === 'duplicates' ? (
            <div className="space-y-4">
              {duplicateGroups.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No duplicate groups detected</p>
                </div>
              ) : (
                duplicateGroups.map(group => (
                  <div key={group.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{group.type} match</p>
                        <p className="text-xs text-gray-500">{group.key}</p>
                      </div>
                      <button
                        onClick={() => mergeDuplicateGroup(group)}
                        disabled={!canMergeDuplicates || mergingGroupId === group.id}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          !canMergeDuplicates
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : mergingGroupId === group.id
                              ? 'bg-purple-200 text-purple-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {mergingGroupId === group.id ? 'Merging...' : 'Merge Suggested'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.contacts.map(contact => (
                        <div
                          key={contact.id}
                          className={`border rounded-lg p-3 ${
                            contact.id === group.primaryId ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {contact.companyName || contact.contactName || 'Unnamed Contact'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {contact.contactName || 'No contact'} • {contact.phone || 'No phone'}
                              </p>
                              {contact.email && (
                                <p className="text-xs text-gray-500 mt-1">{contact.email}</p>
                              )}
                            </div>
                            {contact.id === group.primaryId && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {missingContacts.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">All contacts have required fields</p>
                </div>
              ) : (
                missingContacts.map(contact => {
                  const missing = REQUIRED_CONTACT_FIELDS.filter(field => !normalizeText(contact[field]));
                  return (
                    <div key={contact.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {contact.companyName || contact.contactName || 'Unnamed Contact'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Missing: {missing.map(field => field.replace(/([A-Z])/g, ' $1')).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowQualityModal(false);
                          setEditContact(contact);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                      >
                        Fix Now
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ContactCard({ contact, dealHistory, onEdit, onDelete, onStartWorking, userRole, isAvailable, workingUser }) {
  const hasClosedDeals = dealHistory.filter(d => d.status === 'closed').length > 0;
  const hasLostDeals = dealHistory.filter(d => d.status === 'lost').length > 0;
  const totalDeals = dealHistory.length;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${isAvailable ? 'border-gray-200' : 'border-yellow-300 bg-yellow-50/30'} p-6 hover:shadow-lg transition-all`}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${isAvailable ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-gradient-to-br from-yellow-100 to-orange-100'} flex items-center justify-center flex-shrink-0`}>
            {isAvailable ? (
              <Building2 className="w-6 h-6 text-purple-600" />
            ) : (
              <Lock className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{contact.companyName}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                {contact.category}
              </span>
              {!isAvailable && (
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  In Progress
                </span>
              )}
            </div>
          </div>
        </div>

        {/* DEAL HISTORY BADGES */}
        {totalDeals > 0 && (
          <div className="flex flex-wrap gap-2">
            {hasClosedDeals && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  {dealHistory.filter(d => d.status === 'closed').length} Won
                </span>
              </div>
            )}
            {hasLostDeals && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700">
                  {dealHistory.filter(d => d.status === 'lost').length} Lost
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <History className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">
                {totalDeals} Total Deal{totalDeals !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {!isAvailable && workingUser && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 font-semibold flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Being worked on by: {workingUser}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              This contact is locked until the deal is closed or lost
            </p>
          </div>
        )}

        <div className="space-y-2 text-sm">
          {contact.contactName && (
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{contact.contactName}</span>
              {contact.contactPosition && (
                <span className="text-gray-500">• {contact.contactPosition}</span>
              )}
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{contact.phone}</span>
            </div>
          )}
          
          {contact.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
        </div>

        {contact.notes && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
            💬 {contact.notes}
          </p>
        )}

        <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          {isAvailable ? (
            <button 
              onClick={onStartWorking} 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Working</span>
            </button>
          ) : (
            <button 
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>Locked</span>
            </button>
          )}
          
          <button 
            onClick={onEdit} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-all"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          {userRole === 'admin' && (
            <button 
              onClick={onDelete} 
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {contact.createdByName && (
          <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Added by {contact.createdByName}
          </p>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}

function InputField({ label, icon: Icon, required, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-2" />}
        {label} {required && '*'}
      </label>
      <input
        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        required={required}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
        value={value}
        onChange={onChange}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({ label, icon: Icon, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-2" />}
        {label}
      </label>
      <textarea
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
        placeholder={`Add ${label.toLowerCase()}...`}
        rows={rows}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
