import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
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

const CATEGORIES = [
  'AutoMotive', 'Candy', 'Healthy Beauty Care', 'Package Beverage', 
  'Cigarettes', 'Smoking Accessories', 'Edible Grocery', 'Other Tobacco',
  'Salty Snacks', 'Package Sweet Snacks', 'General Merchandise', 
  'Package Ice Cream', 'B2B', 'Fruits & veg', 'Plastics', 'Raw Material',
  'Barista items', 'Protein Bar', 'Packaged Beverages', 'Other'
];

// COMPLETE CONTACT LIST - All contacts from the spreadsheet (200+ contacts)
const FULL_CONTACT_LIST = [
  { companyName: 'Al dawlia peing', contactName: 'yahia', contactPosition: '', phone: '1116021085', email: 'yahiazakrya@gmail.com', category: 'AutoMotive' },
  { companyName: 'Al shahin', contactName: 'Walid Zakaria / Maged', contactPosition: '', phone: '01007769673', email: 'walid.zakria@alshahin-eg.com', category: 'Candy' },
  { companyName: 'Arab international company for wipes (Haigeen, zeina supplier)', contactName: 'Islam / Ayman', contactPosition: '', phone: '01225176701', email: 'Islam.fouda@zeinagroup.com', category: 'Healthy Beauty Care' },
  { companyName: 'Beyti', contactName: 'Batoul', contactPosition: '', phone: '01069988639', email: 'Batoul.Mohamed@beyti-idj.com', category: 'Package Beverage' },
  { companyName: 'Coca Cola', contactName: 'Amr / Omar', contactPosition: '', phone: '01272269556', email: 'Amr.hany@cchellenic.com', category: 'Package Beverage' },
  { companyName: 'Mansour rel dawlia', contactName: 'Walid', contactPosition: '', phone: '1002189130', email: 'Waleed.Yasien@mansourgroup.com', category: 'Cigarettes' },
  { companyName: 'Dija lighters', contactName: 'Mahmoud', contactPosition: '', phone: '1018766588', email: 'dija.trade18@gmail.com', category: 'Smoking Accessories' },
  { companyName: 'Rashideeen cadbury', contactName: 'Yasser', contactPosition: '', phone: '0 111 033 0422', email: 'Yasser.Abdkarim@rashideenegypt.net', category: 'Candy' },
  { companyName: 'Raya', contactName: 'Hassan', contactPosition: '', phone: '01150900110', email: 'hassan_elesawai@rayacorp.com', category: 'Candy' },
  { companyName: 'Zeina (egyptian company for papers)', contactName: 'Islam', contactPosition: '', phone: '1225176701', email: 'Islam.fouda@zeinagroup.com', category: 'Healthy Beauty Care' },
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
  { companyName: 'ahmed tea', contactName: 'hany ezz', contactPosition: '', phone: '100 695 4747', email: 'Hany.ezz@raslan.co', category: 'Other' },
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
      loadActiveDeals();
      loadDealHistory();
    }
  }, [currentUser]);

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

  async function loadActiveDeals() {
    try {
      const dealsQuery = query(
        collection(db, 'sales'),
        where('status', 'in', ['potential_client', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiating'])
      );
      
      const snapshot = await getDocs(dealsQuery);
      const deals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setActiveDeals(deals);
    } catch (e) {
      console.error('Error loading active deals:', e);
    }
  }

  async function loadDealHistory() {
    try {
      // Load all closed and lost deals for history tracking
      const closedQuery = query(
        collection(db, 'sales'),
        where('status', 'in', ['closed', 'lost'])
      );
      
      const snapshot = await getDocs(closedQuery);
      const deals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setClosedDeals(deals);
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
    return deal ? deal.createdByName : null;
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
      await addDoc(collection(db, 'sales'), {
        businessName: contact.companyName,
        contactPerson: contact.contactName,
        phoneNumber: contact.phone,
        status: 'potential_client',
        price: 0,
        notes: `Category: ${contact.category}\nEmail: ${contact.email || 'N/A'}\nPosition: ${contact.contactPosition || 'N/A'}\n\nOriginal Notes: ${contact.notes || 'None'}`,
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        archived: false,
        sourceContactId: contact.id,
        createdAt: serverTimestamp(),
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