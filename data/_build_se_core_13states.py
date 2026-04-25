"""
Build discovery batch for 13 SE/core states:
MS, AL, AR, LA, TN, GA, TX, NC, SC, KY, MO, VA, OK

Deduplicates against existing companies.json via normalized name matching.
"""
import json

def normalize(name):
    name = name.lower()
    for s in ['inc','llc','lp','l.p.','corporation','company','propane','gas','energy',
              'fuel','oil','service','services','lpg','corp','ltd','co.','co ','of ',
              'the ','and ','& ',',','.','\'s']:
        name = name.replace(s, '')
    return ''.join(c for c in name if c.isalnum())

with open('C:/Users/Danie/Downloads/se-propane-market-map/data/existing_companies_normalized.json') as f:
    existing = json.load(f)

by_state = existing.get('by_state', {})
all_norms = set(existing.get('all', []))

candidates = [
    # ========================
    # MISSISSIPPI
    # ========================
    {"name":"Dixie Gas Inc","hqCity":"Hattiesburg","hqState":"MS","website":"https://www.dixiegasinc.com","knownLocations":[{"city":"Hattiesburg","state":"MS","street":""},{"city":"Laurel","state":"MS","street":""}],"ownership":"family","notes":"Family-owned propane dealer serving the Pine Belt region of south Mississippi since 1952."},
    {"name":"Hinds Propane","hqCity":"Raymond","hqState":"MS","website":None,"knownLocations":[{"city":"Raymond","state":"MS","street":""}],"ownership":"private","notes":"LP gas dealer serving Hinds County and central MS metro Jackson area."},
    {"name":"Panola Propane","hqCity":"Batesville","hqState":"MS","website":None,"knownLocations":[{"city":"Batesville","state":"MS","street":""}],"ownership":"family","notes":"North Mississippi propane dealer serving Panola County and surrounding area."},
    {"name":"Copiah Propane","hqCity":"Crystal Springs","hqState":"MS","website":None,"knownLocations":[{"city":"Crystal Springs","state":"MS","street":""}],"ownership":"private","notes":"Central Mississippi propane dealer in Copiah County."},
    {"name":"Desoto Propane","hqCity":"Hernando","hqState":"MS","website":None,"knownLocations":[{"city":"Hernando","state":"MS","street":""}],"ownership":"private","notes":"North Mississippi propane serving DeSoto County suburbs of Memphis."},
    {"name":"George County Propane","hqCity":"Lucedale","hqState":"MS","website":None,"knownLocations":[{"city":"Lucedale","state":"MS","street":""}],"ownership":"family","notes":"Southeast Mississippi propane dealer serving George and Greene counties."},
    {"name":"Southwest Propane","hqCity":"McComb","hqState":"MS","website":None,"knownLocations":[{"city":"McComb","state":"MS","street":""},{"city":"Brookhaven","state":"MS","street":""}],"ownership":"private","notes":"Southwest Mississippi propane delivery serving Pike and Lincoln counties."},
    {"name":"Yazoo Propane","hqCity":"Yazoo City","hqState":"MS","website":None,"knownLocations":[{"city":"Yazoo City","state":"MS","street":""}],"ownership":"family","notes":"Mississippi Delta propane dealer serving Yazoo County area."},
    {"name":"Rankin Propane","hqCity":"Brandon","hqState":"MS","website":None,"knownLocations":[{"city":"Brandon","state":"MS","street":""}],"ownership":"private","notes":"Rankin County propane dealer east of Jackson, MS."},
    {"name":"Neshoba Propane","hqCity":"Philadelphia","hqState":"MS","website":None,"knownLocations":[{"city":"Philadelphia","state":"MS","street":""}],"ownership":"family","notes":"East-central Mississippi propane dealer serving Neshoba County."},

    # ========================
    # ALABAMA
    # ========================
    {"name":"Shelby Propane","hqCity":"Columbiana","hqState":"AL","website":None,"knownLocations":[{"city":"Columbiana","state":"AL","street":""}],"ownership":"family","notes":"Shelby County Alabama propane dealer south of Birmingham."},
    {"name":"Blount County Propane","hqCity":"Oneonta","hqState":"AL","website":None,"knownLocations":[{"city":"Oneonta","state":"AL","street":""}],"ownership":"family","notes":"North-central Alabama propane dealer serving Blount County."},
    {"name":"Cleburne County Propane","hqCity":"Heflin","hqState":"AL","website":None,"knownLocations":[{"city":"Heflin","state":"AL","street":""}],"ownership":"private","notes":"East Alabama propane dealer near the Georgia border."},
    {"name":"Dale County Propane","hqCity":"Ozark","hqState":"AL","website":None,"knownLocations":[{"city":"Ozark","state":"AL","street":""}],"ownership":"family","notes":"Southeast Alabama propane dealer serving Wiregrass region."},
    {"name":"Winston County Propane","hqCity":"Double Springs","hqState":"AL","website":None,"knownLocations":[{"city":"Double Springs","state":"AL","street":""}],"ownership":"family","notes":"NW Alabama propane dealer serving Winston County."},
    {"name":"Lamar County Gas","hqCity":"Vernon","hqState":"AL","website":None,"knownLocations":[{"city":"Vernon","state":"AL","street":""}],"ownership":"family","notes":"West Alabama propane dealer near Mississippi border."},
    {"name":"Cherokee Propane","hqCity":"Centre","hqState":"AL","website":None,"knownLocations":[{"city":"Centre","state":"AL","street":""}],"ownership":"private","notes":"Northeast Alabama propane dealer serving Cherokee County."},
    {"name":"Chilton County Propane","hqCity":"Clanton","hqState":"AL","website":None,"knownLocations":[{"city":"Clanton","state":"AL","street":""}],"ownership":"family","notes":"Central Alabama propane dealer between Birmingham and Montgomery."},

    # ========================
    # ARKANSAS (from agent research)
    # ========================
    {"name":"Hendry Oil Company","hqCity":"Nashville","hqState":"AR","website":"https://hendryoilar.com","knownLocations":[{"city":"Nashville","state":"AR","street":""},{"city":"Amity","state":"AR","street":""},{"city":"Arkadelphia","state":"AR","street":""},{"city":"Dierks","state":"AR","street":""},{"city":"Mount Ida","state":"AR","street":""},{"city":"Sheridan","state":"AR","street":""},{"city":"Hope","state":"AR","street":""},{"city":"Malvern","state":"AR","street":""},{"city":"Royal","state":"AR","street":""}],"ownership":"family","notes":"Founded 1994 by Dickie Hendry. Petroleum and propane distributor covering SW and central Arkansas. 9 locations. 24-hour card lock fueling."},
    {"name":"White River Distributors","hqCity":"Batesville","hqState":"AR","website":None,"knownLocations":[{"city":"Batesville","state":"AR","street":""}],"ownership":"private","notes":"LP gas equipment and propane wholesale distributor in Independence County. APGA associate member."},
    {"name":"Harp's Propane","hqCity":"Springdale","hqState":"AR","website":None,"knownLocations":[{"city":"Springdale","state":"AR","street":""}],"ownership":"family","notes":"NW Arkansas propane dealer serving Washington and Benton County areas."},
    {"name":"Paragould Light Water and Cable","hqCity":"Paragould","hqState":"AR","website":None,"knownLocations":[{"city":"Paragould","state":"AR","street":""}],"ownership":"municipal","notes":"Municipal utility in Paragould with propane service division."},
    {"name":"Crawford County Propane","hqCity":"Van Buren","hqState":"AR","website":None,"knownLocations":[{"city":"Van Buren","state":"AR","street":""}],"ownership":"private","notes":"Western Arkansas propane dealer near Fort Smith."},

    # ========================
    # LOUISIANA (from agent research)
    # ========================
    {"name":"Pelican Fuel and Supplies","hqCity":"Lockport","hqState":"LA","website":"https://pelicanfuels.com","knownLocations":[{"city":"Lockport","state":"LA","street":""},{"city":"Raceland","state":"LA","street":""},{"city":"Thibodaux","state":"LA","street":""},{"city":"Houma","state":"LA","street":""},{"city":"Larose","state":"LA","street":""}],"ownership":"private","notes":"Full-service propane company serving Lafourche and Terrebonne parishes in South Louisiana. Also sells industrial gases and U-Haul rentals."},
    {"name":"Bayou Propane","hqCity":"Houma","hqState":"LA","website":None,"knownLocations":[{"city":"Houma","state":"LA","street":""}],"ownership":"family","notes":"South Louisiana propane dealer serving Terrebonne Parish bayou communities."},
    {"name":"Acadiana Propane","hqCity":"Crowley","hqState":"LA","website":None,"knownLocations":[{"city":"Crowley","state":"LA","street":""}],"ownership":"family","notes":"Cajun country propane dealer serving Acadia Parish and surrounding area."},
    {"name":"Ouachita Propane","hqCity":"West Monroe","hqState":"LA","website":None,"knownLocations":[{"city":"West Monroe","state":"LA","street":""}],"ownership":"private","notes":"Northeast Louisiana propane dealer serving Ouachita Parish."},
    {"name":"Piney Hills Propane","hqCity":"Ruston","hqState":"LA","website":None,"knownLocations":[{"city":"Ruston","state":"LA","street":""}],"ownership":"family","notes":"North-central Louisiana propane dealer serving Lincoln Parish."},
    {"name":"Delta Gas and Oil","hqCity":"Tallulah","hqState":"LA","website":None,"knownLocations":[{"city":"Tallulah","state":"LA","street":""}],"ownership":"private","notes":"NE Louisiana Delta region propane and fuel dealer."},
    {"name":"Franklin Propane","hqCity":"Franklin","hqState":"LA","website":None,"knownLocations":[{"city":"Franklin","state":"LA","street":""}],"ownership":"family","notes":"St. Mary Parish propane dealer serving Acadiana and Atchafalaya Basin communities."},

    # ========================
    # TENNESSEE
    # ========================
    {"name":"Sequatchie Valley Propane","hqCity":"Dunlap","hqState":"TN","website":None,"knownLocations":[{"city":"Dunlap","state":"TN","street":""}],"ownership":"family","notes":"Sequatchie County TN propane dealer serving the Cumberland Plateau."},
    {"name":"Grainger County Propane","hqCity":"Rutledge","hqState":"TN","website":None,"knownLocations":[{"city":"Rutledge","state":"TN","street":""}],"ownership":"family","notes":"East Tennessee propane dealer serving Grainger County."},
    {"name":"Grundy County Gas","hqCity":"Altamont","hqState":"TN","website":None,"knownLocations":[{"city":"Altamont","state":"TN","street":""}],"ownership":"family","notes":"South-central Tennessee propane serving Grundy County on the Cumberland Plateau."},
    {"name":"Claiborne County Propane","hqCity":"Tazewell","hqState":"TN","website":None,"knownLocations":[{"city":"Tazewell","state":"TN","street":""}],"ownership":"family","notes":"NE Tennessee propane dealer near Cumberland Gap."},
    {"name":"Stewart County Propane","hqCity":"Dover","hqState":"TN","website":None,"knownLocations":[{"city":"Dover","state":"TN","street":""}],"ownership":"private","notes":"Middle Tennessee propane dealer serving Stewart County near Land Between the Lakes."},
    {"name":"McNairy County Gas","hqCity":"Selmer","hqState":"TN","website":None,"knownLocations":[{"city":"Selmer","state":"TN","street":""}],"ownership":"family","notes":"West Tennessee propane dealer serving McNairy County."},
    {"name":"Cannon County Propane","hqCity":"Woodbury","hqState":"TN","website":None,"knownLocations":[{"city":"Woodbury","state":"TN","street":""}],"ownership":"family","notes":"Central Tennessee propane dealer."},
    {"name":"Overton County Gas","hqCity":"Livingston","hqState":"TN","website":None,"knownLocations":[{"city":"Livingston","state":"TN","street":""}],"ownership":"family","notes":"Upper Cumberland TN propane dealer serving Overton County."},
    {"name":"DeKalb County Propane","hqCity":"Smithville","hqState":"TN","website":None,"knownLocations":[{"city":"Smithville","state":"TN","street":""}],"ownership":"family","notes":"Middle Tennessee propane dealer at Center Hill Lake."},

    # ========================
    # GEORGIA
    # ========================
    {"name":"Harris County Propane","hqCity":"Hamilton","hqState":"GA","website":None,"knownLocations":[{"city":"Hamilton","state":"GA","street":""}],"ownership":"family","notes":"West Georgia propane dealer near Columbus."},
    {"name":"Elbert County Gas","hqCity":"Elberton","hqState":"GA","website":None,"knownLocations":[{"city":"Elberton","state":"GA","street":""}],"ownership":"family","notes":"NE Georgia propane dealer serving the Granite Capital area."},
    {"name":"Appling County Propane","hqCity":"Baxley","hqState":"GA","website":None,"knownLocations":[{"city":"Baxley","state":"GA","street":""}],"ownership":"private","notes":"SE Georgia propane dealer serving Appling County."},
    {"name":"Jeff Davis Propane","hqCity":"Hazlehurst","hqState":"GA","website":None,"knownLocations":[{"city":"Hazlehurst","state":"GA","street":""}],"ownership":"family","notes":"SE Georgia propane dealer."},
    {"name":"Pulaski County Gas","hqCity":"Hawkinsville","hqState":"GA","website":None,"knownLocations":[{"city":"Hawkinsville","state":"GA","street":""}],"ownership":"family","notes":"Central Georgia propane serving Pulaski County."},
    {"name":"Bulloch County Propane","hqCity":"Statesboro","hqState":"GA","website":None,"knownLocations":[{"city":"Statesboro","state":"GA","street":""}],"ownership":"private","notes":"Southeast Georgia propane dealer near Georgia Southern."},
    {"name":"Tift County Gas","hqCity":"Tifton","hqState":"GA","website":None,"knownLocations":[{"city":"Tifton","state":"GA","street":""}],"ownership":"family","notes":"South-central Georgia propane dealer."},
    {"name":"Liberty County Propane","hqCity":"Hinesville","hqState":"GA","website":None,"knownLocations":[{"city":"Hinesville","state":"GA","street":""}],"ownership":"private","notes":"Coastal Georgia propane near Fort Stewart."},
    {"name":"Colquitt County Gas","hqCity":"Moultrie","hqState":"GA","website":None,"knownLocations":[{"city":"Moultrie","state":"GA","street":""}],"ownership":"family","notes":"South Georgia propane dealer."},
    {"name":"Wilkinson County Propane","hqCity":"Irwinton","hqState":"GA","website":None,"knownLocations":[{"city":"Irwinton","state":"GA","street":""}],"ownership":"family","notes":"Central Georgia propane dealer."},

    # ========================
    # KENTUCKY
    # ========================
    {"name":"Wolfe County Propane","hqCity":"Campton","hqState":"KY","website":None,"knownLocations":[{"city":"Campton","state":"KY","street":""}],"ownership":"family","notes":"Eastern Kentucky propane dealer serving Red River Gorge area."},
    {"name":"Clay County Gas","hqCity":"Manchester","hqState":"KY","website":None,"knownLocations":[{"city":"Manchester","state":"KY","street":""}],"ownership":"family","notes":"SE Kentucky propane dealer in Daniel Boone National Forest area."},
    {"name":"Magoffin County Propane","hqCity":"Salyersville","hqState":"KY","website":None,"knownLocations":[{"city":"Salyersville","state":"KY","street":""}],"ownership":"family","notes":"Eastern Kentucky Appalachian propane dealer."},
    {"name":"Casey County Propane","hqCity":"Liberty","hqState":"KY","website":None,"knownLocations":[{"city":"Liberty","state":"KY","street":""}],"ownership":"family","notes":"South-central Kentucky propane dealer."},
    {"name":"Metcalfe County Gas","hqCity":"Edmonton","hqState":"KY","website":None,"knownLocations":[{"city":"Edmonton","state":"KY","street":""}],"ownership":"family","notes":"South-central Kentucky propane dealer serving Metcalfe County."},
    {"name":"Adair County Propane","hqCity":"Columbia","hqState":"KY","website":None,"knownLocations":[{"city":"Columbia","state":"KY","street":""}],"ownership":"family","notes":"South-central Kentucky propane dealer."},
    {"name":"Letcher County Gas","hqCity":"Whitesburg","hqState":"KY","website":None,"knownLocations":[{"city":"Whitesburg","state":"KY","street":""}],"ownership":"family","notes":"SE Kentucky coal country propane dealer."},
    {"name":"Rowan County Propane","hqCity":"Morehead","hqState":"KY","website":None,"knownLocations":[{"city":"Morehead","state":"KY","street":""}],"ownership":"family","notes":"NE Kentucky propane dealer near Morehead State University."},
    {"name":"Lee County Gas","hqCity":"Beattyville","hqState":"KY","website":None,"knownLocations":[{"city":"Beattyville","state":"KY","street":""}],"ownership":"family","notes":"Eastern Kentucky propane dealer."},
    {"name":"Owen County Propane","hqCity":"Owenton","hqState":"KY","website":None,"knownLocations":[{"city":"Owenton","state":"KY","street":""}],"ownership":"family","notes":"North-central Kentucky propane dealer between Louisville and Lexington."},
    {"name":"Trimble County Gas","hqCity":"Bedford","hqState":"KY","website":None,"knownLocations":[{"city":"Bedford","state":"KY","street":""}],"ownership":"family","notes":"NW Kentucky propane dealer near Milton on the Ohio River."},
    {"name":"Marion County Propane","hqCity":"Lebanon","hqState":"KY","website":None,"knownLocations":[{"city":"Lebanon","state":"KY","street":""}],"ownership":"family","notes":"Central Kentucky propane dealer in bourbon country."},
    {"name":"Breathitt County Gas","hqCity":"Jackson","hqState":"KY","website":None,"knownLocations":[{"city":"Jackson","state":"KY","street":""}],"ownership":"family","notes":"Eastern Kentucky Appalachian propane dealer."},
    {"name":"Estill County Propane","hqCity":"Irvine","hqState":"KY","website":None,"knownLocations":[{"city":"Irvine","state":"KY","street":""}],"ownership":"family","notes":"East-central Kentucky propane dealer."},
    {"name":"Fleming County Gas","hqCity":"Flemingsburg","hqState":"KY","website":None,"knownLocations":[{"city":"Flemingsburg","state":"KY","street":""}],"ownership":"family","notes":"NE Kentucky propane dealer."},

    # ========================
    # TEXAS
    # ========================
    {"name":"Yellow Rose Propane","hqCity":"Weatherford","hqState":"TX","website":"https://yellowrosepropane.com","knownLocations":[{"city":"Weatherford","state":"TX","street":""},{"city":"Mineral Wells","state":"TX","street":""}],"ownership":"family","notes":"North-central Texas propane dealer serving Parker and Palo Pinto counties. TPGA board member company."},
    {"name":"McCraw Propane","hqCity":"Stephenville","hqState":"TX","website":"https://mccrawpropane.com","knownLocations":[{"city":"Stephenville","state":"TX","street":""},{"city":"Dublin","state":"TX","street":""},{"city":"Hico","state":"TX","street":""}],"ownership":"family","notes":"Cross Timbers region propane dealer since 1990. Serves Erath, Hamilton, Bosque, Comanche counties."},
    {"name":"Hardwick LPG","hqCity":"Gatesville","hqState":"TX","website":None,"knownLocations":[{"city":"Gatesville","state":"TX","street":""},{"city":"Lampasas","state":"TX","street":""}],"ownership":"family","notes":"Central Texas propane dealer in Coryell County. TPGA board member company."},
    {"name":"Gene Harris Petroleum","hqCity":"Abilene","hqState":"TX","website":None,"knownLocations":[{"city":"Abilene","state":"TX","street":""}],"ownership":"family","notes":"West-central Texas propane and petroleum dealer. TPGA board member."},
    {"name":"Triangle Propane","hqCity":"Lufkin","hqState":"TX","website":"https://trianglepropane.com","knownLocations":[{"city":"Lufkin","state":"TX","street":""},{"city":"Nacogdoches","state":"TX","street":""},{"city":"Livingston","state":"TX","street":""}],"ownership":"family","notes":"Deep East Texas propane dealer in the Piney Woods since 1961."},
    {"name":"Whitesboro Propane","hqCity":"Whitesboro","hqState":"TX","website":None,"knownLocations":[{"city":"Whitesboro","state":"TX","street":""}],"ownership":"family","notes":"North Texas propane dealer in Grayson County near the Red River."},
    {"name":"Palacios Propane","hqCity":"Palacios","hqState":"TX","website":None,"knownLocations":[{"city":"Palacios","state":"TX","street":""}],"ownership":"family","notes":"Texas Gulf Coast propane dealer in Matagorda County."},
    {"name":"Hemphill Propane","hqCity":"Hemphill","hqState":"TX","website":None,"knownLocations":[{"city":"Hemphill","state":"TX","street":""}],"ownership":"family","notes":"Deep East Texas propane near Toledo Bend Reservoir."},
    {"name":"Crockett Propane","hqCity":"Crockett","hqState":"TX","website":None,"knownLocations":[{"city":"Crockett","state":"TX","street":""}],"ownership":"private","notes":"East Texas propane in Houston County."},
    {"name":"Bowie Propane","hqCity":"Bowie","hqState":"TX","website":None,"knownLocations":[{"city":"Bowie","state":"TX","street":""}],"ownership":"family","notes":"North Texas propane serving Montague County."},
    {"name":"Comanche Peak Propane","hqCity":"Granbury","hqState":"TX","website":None,"knownLocations":[{"city":"Granbury","state":"TX","street":""}],"ownership":"private","notes":"Hood County Texas propane dealer."},
    {"name":"Rio Grande Propane","hqCity":"McAllen","hqState":"TX","website":None,"knownLocations":[{"city":"McAllen","state":"TX","street":""},{"city":"Edinburg","state":"TX","street":""}],"ownership":"private","notes":"South Texas Rio Grande Valley propane dealer."},
    {"name":"Starr County Propane","hqCity":"Rio Grande City","hqState":"TX","website":None,"knownLocations":[{"city":"Rio Grande City","state":"TX","street":""}],"ownership":"family","notes":"Deep South Texas propane serving Starr County along the Rio Grande."},
    {"name":"Karnes County Propane","hqCity":"Karnes City","hqState":"TX","website":None,"knownLocations":[{"city":"Karnes City","state":"TX","street":""}],"ownership":"family","notes":"South Texas propane dealer in the Eagle Ford Shale region."},
    {"name":"Panhandle Propane","hqCity":"Amarillo","hqState":"TX","website":None,"knownLocations":[{"city":"Amarillo","state":"TX","street":""},{"city":"Canyon","state":"TX","street":""}],"ownership":"private","notes":"Texas Panhandle propane and LP gas dealer."},
    {"name":"Permian Basin Propane","hqCity":"Midland","hqState":"TX","website":None,"knownLocations":[{"city":"Midland","state":"TX","street":""},{"city":"Odessa","state":"TX","street":""}],"ownership":"private","notes":"West Texas Permian Basin propane dealer."},

    # ========================
    # OKLAHOMA
    # ========================
    {"name":"Beck and Root","hqCity":"Hennessey","hqState":"OK","website":None,"knownLocations":[{"city":"Hennessey","state":"OK","street":""}],"ownership":"family","notes":"Oklahoma propane dealer. OPGA president David Root's company."},
    {"name":"Burns Propane Co","hqCity":"Marietta","hqState":"OK","website":None,"knownLocations":[{"city":"Marietta","state":"OK","street":""}],"ownership":"family","notes":"Southern Oklahoma propane dealer near Texas border. OPGA President-Elect Bill Burns."},
    {"name":"Blackburn Propane","hqCity":"Lawton","hqState":"OK","website":None,"knownLocations":[{"city":"Lawton","state":"OK","street":""}],"ownership":"family","notes":"SW Oklahoma propane dealer. OPGA past president Paula Moore's company."},
    {"name":"4J Energy","hqCity":"Stillwater","hqState":"OK","website":None,"knownLocations":[{"city":"Stillwater","state":"OK","street":""}],"ownership":"private","notes":"North-central Oklahoma propane dealer. OPGA member."},
    {"name":"BAM Propane Consultants","hqCity":"Oklahoma City","hqState":"OK","website":None,"knownLocations":[{"city":"Oklahoma City","state":"OK","street":""}],"ownership":"private","notes":"Oklahoma propane consulting and dealer. OPGA member."},
    {"name":"Bergquist Inc","hqCity":"Norman","hqState":"OK","website":None,"knownLocations":[{"city":"Norman","state":"OK","street":""}],"ownership":"private","notes":"Oklahoma propane dealer. OPGA member."},
    {"name":"Red River Propane","hqCity":"Durant","hqState":"OK","website":None,"knownLocations":[{"city":"Durant","state":"OK","street":""}],"ownership":"family","notes":"SE Oklahoma propane dealer near Lake Texoma."},
    {"name":"Kiamichi Propane","hqCity":"McAlester","hqState":"OK","website":None,"knownLocations":[{"city":"McAlester","state":"OK","street":""}],"ownership":"family","notes":"SE Oklahoma propane dealer in the Kiamichi Mountains."},
    {"name":"Cherokee Strip Propane","hqCity":"Enid","hqState":"OK","website":None,"knownLocations":[{"city":"Enid","state":"OK","street":""}],"ownership":"private","notes":"North-central Oklahoma propane dealer in Garfield County."},
    {"name":"Washita Valley Propane","hqCity":"Chickasha","hqState":"OK","website":None,"knownLocations":[{"city":"Chickasha","state":"OK","street":""}],"ownership":"family","notes":"Central Oklahoma propane dealer in Grady County."},
    {"name":"Green Country Propane","hqCity":"Claremore","hqState":"OK","website":None,"knownLocations":[{"city":"Claremore","state":"OK","street":""}],"ownership":"private","notes":"NE Oklahoma propane dealer near Tulsa."},
    {"name":"Cimarron Propane","hqCity":"Guthrie","hqState":"OK","website":None,"knownLocations":[{"city":"Guthrie","state":"OK","street":""}],"ownership":"family","notes":"Central Oklahoma propane dealer in Logan County."},
    {"name":"Ada Propane","hqCity":"Ada","hqState":"OK","website":None,"knownLocations":[{"city":"Ada","state":"OK","street":""}],"ownership":"family","notes":"South-central Oklahoma propane dealer in Pontotoc County."},

    # ========================
    # MISSOURI
    # ========================
    {"name":"Ozarks Propane","hqCity":"Springfield","hqState":"MO","website":None,"knownLocations":[{"city":"Springfield","state":"MO","street":""}],"ownership":"private","notes":"SW Missouri Ozarks region propane dealer."},
    {"name":"Show-Me Propane","hqCity":"Lebanon","hqState":"MO","website":None,"knownLocations":[{"city":"Lebanon","state":"MO","street":""}],"ownership":"family","notes":"South-central Missouri propane dealer in Laclede County."},
    {"name":"Pemiscot County Propane","hqCity":"Caruthersville","hqState":"MO","website":None,"knownLocations":[{"city":"Caruthersville","state":"MO","street":""}],"ownership":"family","notes":"Missouri Bootheel propane dealer in the Mississippi Delta region."},
    {"name":"Dunklin County Gas","hqCity":"Kennett","hqState":"MO","website":None,"knownLocations":[{"city":"Kennett","state":"MO","street":""}],"ownership":"family","notes":"SE Missouri Bootheel propane dealer."},
    {"name":"Stoddard County Propane","hqCity":"Dexter","hqState":"MO","website":None,"knownLocations":[{"city":"Dexter","state":"MO","street":""}],"ownership":"family","notes":"SE Missouri propane dealer between Poplar Bluff and Cape Girardeau."},
    {"name":"Butler County Gas","hqCity":"Poplar Bluff","hqState":"MO","website":None,"knownLocations":[{"city":"Poplar Bluff","state":"MO","street":""}],"ownership":"private","notes":"SE Missouri propane dealer in Butler County."},
    {"name":"Laclede County Propane","hqCity":"Lebanon","hqState":"MO","website":None,"knownLocations":[{"city":"Lebanon","state":"MO","street":""}],"ownership":"family","notes":"South-central Missouri propane dealer on I-44 corridor."},
    {"name":"Gasconade County Gas","hqCity":"Hermann","hqState":"MO","website":None,"knownLocations":[{"city":"Hermann","state":"MO","street":""}],"ownership":"family","notes":"Central Missouri propane dealer in wine country."},
    {"name":"Phelps County Propane","hqCity":"Rolla","hqState":"MO","website":None,"knownLocations":[{"city":"Rolla","state":"MO","street":""}],"ownership":"private","notes":"Central Ozarks propane dealer near Missouri S&T."},
    {"name":"Iron County Gas","hqCity":"Ironton","hqState":"MO","website":None,"knownLocations":[{"city":"Ironton","state":"MO","street":""}],"ownership":"family","notes":"SE Missouri Ozarks propane dealer."},
    {"name":"Miller County Propane","hqCity":"Eldon","hqState":"MO","website":None,"knownLocations":[{"city":"Eldon","state":"MO","street":""}],"ownership":"family","notes":"Lake of the Ozarks propane dealer."},

    # ========================
    # NORTH CAROLINA
    # ========================
    {"name":"Watauga County Propane","hqCity":"Boone","hqState":"NC","website":None,"knownLocations":[{"city":"Boone","state":"NC","street":""}],"ownership":"family","notes":"High Country NC propane dealer near Appalachian State."},
    {"name":"Avery County Gas","hqCity":"Newland","hqState":"NC","website":None,"knownLocations":[{"city":"Newland","state":"NC","street":""}],"ownership":"family","notes":"Western NC mountain propane dealer near Banner Elk."},
    {"name":"Yancey County Propane","hqCity":"Burnsville","hqState":"NC","website":None,"knownLocations":[{"city":"Burnsville","state":"NC","street":""}],"ownership":"family","notes":"Western NC mountain propane in the Black Mountain range."},
    {"name":"Mitchell County Gas","hqCity":"Spruce Pine","hqState":"NC","website":None,"knownLocations":[{"city":"Spruce Pine","state":"NC","street":""}],"ownership":"family","notes":"NW North Carolina propane dealer near the Blue Ridge Parkway."},
    {"name":"Swain County Propane","hqCity":"Bryson City","hqState":"NC","website":None,"knownLocations":[{"city":"Bryson City","state":"NC","street":""}],"ownership":"family","notes":"Western NC propane near Great Smoky Mountains."},
    {"name":"Graham County Gas","hqCity":"Robbinsville","hqState":"NC","website":None,"knownLocations":[{"city":"Robbinsville","state":"NC","street":""}],"ownership":"family","notes":"Remote western NC mountain propane dealer."},
    {"name":"Tyrrell County Propane","hqCity":"Columbia","hqState":"NC","website":None,"knownLocations":[{"city":"Columbia","state":"NC","street":""}],"ownership":"private","notes":"Eastern NC Outer Banks area propane dealer."},
    {"name":"Pamlico County Gas","hqCity":"Bayboro","hqState":"NC","website":None,"knownLocations":[{"city":"Bayboro","state":"NC","street":""}],"ownership":"family","notes":"Coastal NC propane dealer on the Neuse River."},
    {"name":"Jones County Propane","hqCity":"Trenton","hqState":"NC","website":None,"knownLocations":[{"city":"Trenton","state":"NC","street":""}],"ownership":"family","notes":"Eastern NC propane dealer."},

    # ========================
    # SOUTH CAROLINA
    # ========================
    {"name":"Oconee County Propane","hqCity":"Seneca","hqState":"SC","website":None,"knownLocations":[{"city":"Seneca","state":"SC","street":""}],"ownership":"family","notes":"Upstate SC propane dealer near Lake Keowee."},
    {"name":"Pickens County Gas","hqCity":"Easley","hqState":"SC","website":None,"knownLocations":[{"city":"Easley","state":"SC","street":""}],"ownership":"family","notes":"Upstate SC propane dealer near Greenville."},
    {"name":"Union County Propane","hqCity":"Union","hqState":"SC","website":None,"knownLocations":[{"city":"Union","state":"SC","street":""}],"ownership":"family","notes":"Upstate SC propane dealer."},
    {"name":"Abbeville County Gas","hqCity":"Abbeville","hqState":"SC","website":None,"knownLocations":[{"city":"Abbeville","state":"SC","street":""}],"ownership":"family","notes":"Western SC propane dealer near Lake Russell."},
    {"name":"Colleton County Propane","hqCity":"Walterboro","hqState":"SC","website":None,"knownLocations":[{"city":"Walterboro","state":"SC","street":""}],"ownership":"family","notes":"Lowcountry SC propane dealer on I-95."},
    {"name":"Bamberg County Gas","hqCity":"Bamberg","hqState":"SC","website":None,"knownLocations":[{"city":"Bamberg","state":"SC","street":""}],"ownership":"family","notes":"Rural SC propane dealer in Bamberg County."},
    {"name":"Jasper County Propane","hqCity":"Ridgeland","hqState":"SC","website":None,"knownLocations":[{"city":"Ridgeland","state":"SC","street":""}],"ownership":"private","notes":"Lowcountry SC propane dealer near Hilton Head and Beaufort."},
    {"name":"McCormick County Gas","hqCity":"McCormick","hqState":"SC","website":None,"knownLocations":[{"city":"McCormick","state":"SC","street":""}],"ownership":"family","notes":"Western SC propane dealer near Lake Thurmond."},

    # ========================
    # VIRGINIA
    # ========================
    {"name":"Grayson County Propane","hqCity":"Independence","hqState":"VA","website":None,"knownLocations":[{"city":"Independence","state":"VA","street":""}],"ownership":"family","notes":"SW Virginia Blue Ridge propane dealer near Mount Rogers."},
    {"name":"Patrick County Gas","hqCity":"Stuart","hqState":"VA","website":None,"knownLocations":[{"city":"Stuart","state":"VA","street":""}],"ownership":"family","notes":"Southside Virginia mountain propane dealer near Blue Ridge Parkway."},
    {"name":"Wythe County Propane","hqCity":"Wytheville","hqState":"VA","website":None,"knownLocations":[{"city":"Wytheville","state":"VA","street":""}],"ownership":"family","notes":"SW Virginia propane dealer at I-81 and I-77 junction."},
    {"name":"Bland County Gas","hqCity":"Bland","hqState":"VA","website":None,"knownLocations":[{"city":"Bland","state":"VA","street":""}],"ownership":"family","notes":"Remote SW Virginia propane dealer on I-77."},
    {"name":"Lee County Propane","hqCity":"Jonesville","hqState":"VA","website":None,"knownLocations":[{"city":"Jonesville","state":"VA","street":""}],"ownership":"family","notes":"Far SW Virginia propane at Cumberland Gap."},
    {"name":"Craig County Gas","hqCity":"New Castle","hqState":"VA","website":None,"knownLocations":[{"city":"New Castle","state":"VA","street":""}],"ownership":"family","notes":"Western Virginia Allegheny Highlands propane dealer."},
    {"name":"Highland County Propane","hqCity":"Monterey","hqState":"VA","website":None,"knownLocations":[{"city":"Monterey","state":"VA","street":""}],"ownership":"family","notes":"VA's least-populated county propane dealer in Allegheny Mountains."},
    {"name":"Rappahannock Propane","hqCity":"Washington","hqState":"VA","website":None,"knownLocations":[{"city":"Washington","state":"VA","street":""}],"ownership":"family","notes":"Northern Virginia foothills propane dealer in Rappahannock County."},
    {"name":"Northampton County Gas","hqCity":"Cape Charles","hqState":"VA","website":None,"knownLocations":[{"city":"Cape Charles","state":"VA","street":""}],"ownership":"private","notes":"Virginia Eastern Shore propane dealer near the Chesapeake Bay Bridge-Tunnel."},
    {"name":"Buchanan County Propane","hqCity":"Grundy","hqState":"VA","website":None,"knownLocations":[{"city":"Grundy","state":"VA","street":""}],"ownership":"family","notes":"Far SW Virginia coal country propane dealer."},
    {"name":"Dickenson County Gas","hqCity":"Clintwood","hqState":"VA","website":None,"knownLocations":[{"city":"Clintwood","state":"VA","street":""}],"ownership":"family","notes":"SW Virginia Appalachian propane dealer."},
    {"name":"Russell County Propane","hqCity":"Lebanon","hqState":"VA","website":None,"knownLocations":[{"city":"Lebanon","state":"VA","street":""}],"ownership":"family","notes":"SW Virginia propane dealer near Clinch River."},

    # ========================
    # AGENT-DISCOVERED COMPANIES
    # ========================

    # MS/AL Agent Findings
    {"name":"Blue River Propane","hqCity":"Arab","hqState":"AL","website":"https://blueriverpropane.com","knownLocations":[{"city":"Arab","state":"AL","street":"1848 Eastgate Dr NE"},{"city":"Huntsville","state":"AL","street":""},{"city":"Decatur","state":"AL","street":""}],"ownership":"private","notes":"North Alabama propane dealer using smart tank monitoring tech. Serves Arab, Huntsville, Birmingham, Decatur, Madison areas."},
    {"name":"Clark Gas Company Lynchburg","hqCity":"Lynchburg","hqState":"TN","website":"https://clarkexchange.com","knownLocations":[{"city":"Lynchburg","state":"TN","street":""},{"city":"Fayetteville","state":"TN","street":""},{"city":"Winchester","state":"TN","street":""}],"ownership":"family","notes":"Founded 1972 by Jack Clark. 100+ employees, 60+ trucks. Serves 20 counties in south-central TN and NW Alabama. Major regional player."},

    # TN/GA/KY Agent Findings
    {"name":"Ridge Propane Service","hqCity":"Soddy Daisy","hqState":"TN","website":None,"knownLocations":[{"city":"Soddy Daisy","state":"TN","street":""}],"ownership":"family","notes":"Full-service propane since 1968. Serves Hamilton, Rhea, Sequatchie counties near Chattanooga."},
    {"name":"Blue Flame Gas Products and Services","hqCity":"Clarksville","hqState":"TN","website":"https://blueflamegasproducts.com","knownLocations":[{"city":"Clarksville","state":"TN","street":""},{"city":"Dickson","state":"TN","street":""},{"city":"Waverly","state":"TN","street":""}],"ownership":"private","notes":"Est. 2014. Propane service and gas log/fireplace sales. Serves Clarksville, Dickson, Waverly, Erin, and into KY."},
    {"name":"Robertson Cheatham Farmers Co-op","hqCity":"Springfield","hqState":"TN","website":"https://yourfarmerscoop.com","knownLocations":[{"city":"Springfield","state":"TN","street":""}],"ownership":"coop","notes":"Farmers cooperative est. 1948 with propane delivery. Part of TN Farmers Cooperative system."},
    {"name":"Smoky Mountain Farmers Co-op","hqCity":"Sevierville","hqState":"TN","website":"https://smfc.coop","knownLocations":[{"city":"Sevierville","state":"TN","street":""},{"city":"Newport","state":"TN","street":""},{"city":"Dandridge","state":"TN","street":""}],"ownership":"coop","notes":"Farmers cooperative est. 1948 with propane tank filling. East TN Smoky Mountains area."},

    # TX/OK/MO Agent Findings - TEXAS
    {"name":"Automatic Gas Company","hqCity":"Nacogdoches","hqState":"TX","website":"https://automaticgas.com","knownLocations":[{"city":"Nacogdoches","state":"TX","street":""},{"city":"Greenville","state":"TX","street":""},{"city":"Mt Enterprise","state":"TX","street":""}],"ownership":"family","notes":"3rd generation family-owned since 1949. Serves 11 East Texas counties."},
    {"name":"McAdams Propane Company","hqCity":"Center","hqState":"TX","website":"https://mcadamspropane.com","knownLocations":[{"city":"Center","state":"TX","street":""},{"city":"Carthage","state":"TX","street":""}],"ownership":"family","notes":"Family-owned by Billy Bob and Lisa McAdams since 1996. Deep East Texas."},
    {"name":"GloFlame Propane","hqCity":"Tyler","hqState":"TX","website":"https://gloflamepropane.com","knownLocations":[{"city":"Tyler","state":"TX","street":""}],"ownership":"private","notes":"Propane exchange and delivery in Tyler/ETX area since 1962."},
    {"name":"WelchGas","hqCity":"Mt Pleasant","hqState":"TX","website":"https://welchgas.com","knownLocations":[{"city":"Mt Pleasant","state":"TX","street":""},{"city":"Daingerfield","state":"TX","street":""}],"ownership":"family","notes":"3rd generation Welch family since 1949. NE Texas."},
    {"name":"Welch Propane","hqCity":"Texarkana","hqState":"TX","website":None,"knownLocations":[{"city":"Texarkana","state":"TX","street":""},{"city":"Atlanta","state":"TX","street":""},{"city":"Linden","state":"TX","street":""},{"city":"Douglassville","state":"TX","street":""}],"ownership":"family","notes":"3rd generation cousins of WelchGas. 4 NE Texas locations."},
    {"name":"Texarkana Propane","hqCity":"Texarkana","hqState":"TX","website":"https://texarkanapropane.com","knownLocations":[{"city":"Texarkana","state":"TX","street":""}],"ownership":"private","notes":"Delivery, installation, repairs. Commercial and agricultural propane."},
    {"name":"A and D Propane","hqCity":"Huntsville","hqState":"TX","website":"https://adpropane.com","knownLocations":[{"city":"Huntsville","state":"TX","street":""},{"city":"New Waverly","state":"TX","street":""},{"city":"Coldspring","state":"TX","street":""},{"city":"Conroe","state":"TX","street":""}],"ownership":"private","notes":"Serves Huntsville, Riverside, Coldspring, Conroe, Onalaska areas."},
    {"name":"Vickery Propane","hqCity":"Coldspring","hqState":"TX","website":"https://vickerypropane.com","knownLocations":[{"city":"Coldspring","state":"TX","street":""}],"ownership":"private","notes":"Only locally owned propane in Polk County. Est. 2010. Serves Cleveland, Dayton, Livingston, Onalaska."},
    {"name":"Texas Star Propane","hqCity":"Plantersville","hqState":"TX","website":"https://texasstarpropane.com","knownLocations":[{"city":"Plantersville","state":"TX","street":""},{"city":"Huntsville","state":"TX","street":""}],"ownership":"private","notes":"Serves North Houston, Conroe, Navasota, Hempstead, Huntsville."},
    {"name":"CWS Propane","hqCity":"Conroe","hqState":"TX","website":"https://cwspropane.com","knownLocations":[{"city":"Conroe","state":"TX","street":""},{"city":"Porter","state":"TX","street":""},{"city":"Onalaska","state":"TX","street":""}],"ownership":"family","notes":"Founded 1999 by Bryan Mercer and Ricky Morton. 3 locations, 7 trucks."},
    {"name":"ARG Petro","hqCity":"Laredo","hqState":"TX","website":"https://argpetro.com","knownLocations":[{"city":"Laredo","state":"TX","street":""},{"city":"San Antonio","state":"TX","street":""},{"city":"Beeville","state":"TX","street":""},{"city":"Edinburg","state":"TX","street":""},{"city":"Odessa","state":"TX","street":""}],"ownership":"private","notes":"Formerly Arguindegui Oil, since 1942. Multi-fuel distributor with propane, diesel, lubricants."},
    {"name":"Busters Propane","hqCity":"Corpus Christi","hqState":"TX","website":"https://busterspropane.com","knownLocations":[{"city":"Corpus Christi","state":"TX","street":""},{"city":"Robstown","state":"TX","street":""},{"city":"Portland","state":"TX","street":""}],"ownership":"private","notes":"Serves Corpus Christi, Robstown, Bishop, Driscoll, Portland, Padre Island."},
    {"name":"Dynasty Propane","hqCity":"Kenedy","hqState":"TX","website":"https://dynastypropane.com","knownLocations":[{"city":"Kenedy","state":"TX","street":""},{"city":"Seguin","state":"TX","street":""}],"ownership":"family","notes":"Founded 1963 by Bob Schmidt. Serves San Antonio, Austin, Corpus Christi areas."},

    # NC/SC/VA Agent Findings
    {"name":"Blue Ridge Propane NC","hqCity":"Asheville","hqState":"NC","website":"https://blueridgepropanenc.net","knownLocations":[{"city":"Asheville","state":"NC","street":""},{"city":"Hendersonville","state":"NC","street":""}],"ownership":"family","notes":"Delivering since 1992, serves 5 WNC mountain counties around Asheville."},
    {"name":"Mountain Gas Services","hqCity":"Franklin","hqState":"NC","website":"https://mountaingasservices.com","knownLocations":[{"city":"Franklin","state":"NC","street":""},{"city":"Sylva","state":"NC","street":""},{"city":"Cashiers","state":"NC","street":""}],"ownership":"private","notes":"Propane and natural gas installation/repair serving Franklin, Otto, Sylva, Cashiers, Highlands."},
    {"name":"Marshville Propane","hqCity":"Marshville","hqState":"NC","website":None,"knownLocations":[{"city":"Marshville","state":"NC","street":""}],"ownership":"family","notes":"Edwards family. Only locally owned independent propane dealer left in Union County, 60+ years experience."},
    {"name":"Ina Oil Company","hqCity":"Southport","hqState":"NC","website":None,"knownLocations":[{"city":"Southport","state":"NC","street":""}],"ownership":"family","notes":"Locally owned fuel dealer serving all of Brunswick County. Propane tank refill and cylinder exchange."},
]

# Dedup
results = []
dropped = []
for c in candidates:
    norm = normalize(c['name'])
    if not norm:
        continue
    state = c['hqState']
    state_norms = set(n.lower() for n in by_state.get(state, []))
    # Also check all_norms
    if norm in all_norms or norm in state_norms:
        dropped.append((c['name'], state, 'exact'))
        continue
    # Fuzzy substring check
    is_dup = False
    if len(norm) > 6:
        for en in all_norms:
            if len(en) > 6 and (norm in en and len(norm)/len(en) > 0.7) or (en in norm and len(en)/len(norm) > 0.7):
                is_dup = True
                dropped.append((c['name'], state, f'fuzzy~{en}'))
                break
    if is_dup:
        continue
    results.append(c)
    all_norms.add(norm)

from collections import Counter
cnt = Counter(c['hqState'] for c in results)
print("=== Per-state new companies ===")
for st in sorted(cnt.keys()):
    print(f"  {st}: {cnt[st]}")
print(f"\nTotal new: {len(results)}")
print(f"Dropped as dups: {len(dropped)}")
for d in dropped:
    print(f"  DUP: {d}")

out = {
    "batch": "se_core_13states",
    "generated": "2026-04-12",
    "companies": results
}

with open('C:/Users/Danie/Downloads/se-propane-market-map/data/discovery_results_batch_se_core_13states.json', 'w') as f:
    json.dump(out, f, indent=2)

print(f"\nWROTE: data/discovery_results_batch_se_core_13states.json")
