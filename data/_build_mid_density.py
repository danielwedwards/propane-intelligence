import json

def normalize(name):
    name = name.lower()
    for s in ['inc','llc','lp','corporation','company','propane','gas','energy','fuel','oil','service','services','lpg','corp','ltd']:
        name = name.replace(s, '')
    return ''.join(c for c in name if c.isalnum())

with open('C:/Users/Danie/Downloads/se-propane-market-map/data/existing_companies_normalized.json') as f:
    existing = json.load(f)

by_state = existing.get('by_state', {})

candidates = [
    # OHIO
    {"name":"Youngstown Propane Inc","hqCity":"Austintown","hqState":"OH","website":"https://youngstownpropane.com","knownLocations":[{"city":"Austintown","state":"OH","street":""}],"ownership":"family","notes":"Family-owned since 1981, one of the largest independents in Northeast Ohio and Western PA. Owned by the Jones family."},
    {"name":"Santmyer Oil Company","hqCity":"Wooster","hqState":"OH","website":"https://www.santmyer.com","knownLocations":[{"city":"Wooster","state":"OH","street":""},{"city":"Ashland","state":"OH","street":""}],"ownership":"family","notes":"Family group founded 1952, 200+ employees. Acquired Cole Distributing (central Ohio propane) recently."},
    {"name":"Cole Distributing","hqCity":"Columbus","hqState":"OH","website":None,"knownLocations":[{"city":"Columbus","state":"OH","street":""}],"ownership":"private","notes":"Central Ohio propane/fuel distributor founded 1980 by Rodney and Kathleen Cole. Acquired by Santmyer."},
    {"name":"Cherrys Propane Service","hqCity":"Ottawa","hqState":"OH","website":"https://www.cherryspropane.com","knownLocations":[{"city":"Ottawa","state":"OH","street":"5393 State Route 224"}],"ownership":"family","notes":"NW Ohio independent propane dealer serving Putnam County area for 20+ years."},
    {"name":"Reliance Propane and Fuel Oil","hqCity":"Toledo","hqState":"OH","website":"https://reliance-energy.com","knownLocations":[{"city":"Toledo","state":"OH","street":"6025 Secor Road"},{"city":"Perrysburg","state":"OH","street":""}],"ownership":"private","notes":"Full-service NW Ohio and SE Michigan propane, fuel oil, industrial gas delivery."},
    {"name":"Heritage Cooperative","hqCity":"Kenton","hqState":"OH","website":"https://www.heritagecooperative.com","knownLocations":[{"city":"Kenton","state":"OH","street":""},{"city":"Bellville","state":"OH","street":""}],"ownership":"coop","notes":"Agricultural cooperative with 1st Choice Energy Services division; dozen-plus locations across Ohio."},
    {"name":"Mercer Landmark","hqCity":"Celina","hqState":"OH","website":"https://www.mercerlandmarkpropane.com","knownLocations":[{"city":"Celina","state":"OH","street":""}],"ownership":"coop","notes":"Northwest Ohio ag coop, 23 locations, 3500 members. Strategic alliance with Centerra Co-op (2024)."},
    {"name":"Pivotal Propane","hqCity":"St Clairsville","hqState":"OH","website":"https://pivotalpropane.com","knownLocations":[{"city":"St Clairsville","state":"OH","street":""},{"city":"Steubenville","state":"OH","street":""},{"city":"Byesville","state":"OH","street":""}],"ownership":"private","notes":"Ohio Valley propane dealer serving eastern OH and WV panhandle."},
    {"name":"NW Ohio Propane LLC","hqCity":"Bryan","hqState":"OH","website":"https://nwohiopropane.com","knownLocations":[{"city":"Bryan","state":"OH","street":""}],"ownership":"coop","notes":"Affiliated with North Western Electric Cooperative. Serves far NW Ohio."},
    {"name":"Mount Perry Propane","hqCity":"Mount Perry","hqState":"OH","website":"https://mountperrypropane.com","knownLocations":[{"city":"Mount Perry","state":"OH","street":""}],"ownership":"family","notes":"SE Ohio propane provider serving Zanesville and Coshocton region."},
    {"name":"Keene Gas","hqCity":"Zanesville","hqState":"OH","website":None,"knownLocations":[{"city":"Zanesville","state":"OH","street":""},{"city":"Cambridge","state":"OH","street":""},{"city":"Coshocton","state":"OH","street":""}],"ownership":"coop","notes":"Co-Alliance LLP propane division serving east-central Ohio."},
    {"name":"Holmes Propane","hqCity":"Millersburg","hqState":"OH","website":None,"knownLocations":[{"city":"Millersburg","state":"OH","street":""}],"ownership":"family","notes":"Holmes County Ohio Amish country propane supplier."},
    # WISCONSIN
    {"name":"Garrow Oil and Propane","hqCity":"Appleton","hqState":"WI","website":"https://www.garrowoil.com","knownLocations":[{"city":"Appleton","state":"WI","street":"504 W Edgewood Dr"},{"city":"Fond du Lac","state":"WI","street":""}],"ownership":"family","notes":"50-plus years serving Fox Valley and east-central WI."},
    {"name":"Draeger Propane","hqCity":"Antigo","hqState":"WI","website":"https://draegerpropane.com","knownLocations":[{"city":"Antigo","state":"WI","street":""},{"city":"Rhinelander","state":"WI","street":""}],"ownership":"family","notes":"Draeger and Schmoll families. 3000-plus customers across 10 northern WI counties."},
    {"name":"Crawford Oil and Propane","hqCity":"Portage","hqState":"WI","website":"https://crawfordoilandpropane.com","knownLocations":[{"city":"Portage","state":"WI","street":""}],"ownership":"family","notes":"3rd-generation family-owned since 1935. Serves central WI (Portage, Baraboo, Dells, Reedsburg, Madison suburbs)."},
    {"name":"United Cooperative","hqCity":"Beaver Dam","hqState":"WI","website":"https://www.unitedcooperative.com","knownLocations":[{"city":"Beaver Dam","state":"WI","street":""},{"city":"Mayville","state":"WI","street":""},{"city":"Hillsboro","state":"WI","street":""},{"city":"Pickett","state":"WI","street":""}],"ownership":"coop","notes":"Large ag coop with multi-site propane division across south-central WI."},
    {"name":"Landmark Services Cooperative","hqCity":"Cottage Grove","hqState":"WI","website":None,"knownLocations":[{"city":"Brodhead","state":"WI","street":""},{"city":"Burlington","state":"WI","street":""}],"ownership":"coop","notes":"SE WI agricultural coop with propane division."},
    {"name":"CHS Larsen Cooperative","hqCity":"Oconto Falls","hqState":"WI","website":None,"knownLocations":[{"city":"Oconto Falls","state":"WI","street":"7363 State Hwy 22"},{"city":"New London","state":"WI","street":""},{"city":"Wild Rose","state":"WI","street":""},{"city":"Weyauwega","state":"WI","street":""},{"city":"Mountain","state":"WI","street":""}],"ownership":"coop","notes":"CHS affiliate coop with 17-plus propane locations in NE Wisconsin."},
    {"name":"Insight FS Servco Co-op","hqCity":"Green Bay","hqState":"WI","website":None,"knownLocations":[{"city":"Green Bay","state":"WI","street":"3091 Voyager Dr"}],"ownership":"coop","notes":"GROWMARK affiliate. Serves Brown, Kewaunee, Manitowoc, Oconto, Outagamie, Shawano, Calumet, Door, Winnebago counties."},
    {"name":"Frontier FS Cooperative","hqCity":"Jefferson","hqState":"WI","website":None,"knownLocations":[{"city":"Jefferson","state":"WI","street":""}],"ownership":"coop","notes":"Eastern WI ag coop with propane division."},
    {"name":"Central Wisconsin Co-op","hqCity":"Stratford","hqState":"WI","website":None,"knownLocations":[{"city":"Stratford","state":"WI","street":""}],"ownership":"coop","notes":"Central WI ag coop with propane division (ZIP 54484)."},
    {"name":"Weiler Enterprises","hqCity":"Marshfield","hqState":"WI","website":None,"knownLocations":[{"city":"Marshfield","state":"WI","street":"2211 West 5th Street"}],"ownership":"family","notes":"Central WI propane and fuel dealer."},
    {"name":"Synergy Cooperative","hqCity":"Ridgeland","hqState":"WI","website":None,"knownLocations":[{"city":"Ridgeland","state":"WI","street":""}],"ownership":"coop","notes":"NW Wisconsin ag and petroleum coop with propane."},
    {"name":"Premier Cooperative","hqCity":"Mount Horeb","hqState":"WI","website":None,"knownLocations":[{"city":"Mount Horeb","state":"WI","street":""},{"city":"Westby","state":"WI","street":""}],"ownership":"coop","notes":"SW Wisconsin cooperative with propane and petroleum division."},
    {"name":"Allied Cooperative","hqCity":"Adams","hqState":"WI","website":None,"knownLocations":[{"city":"Adams","state":"WI","street":""},{"city":"Galesville","state":"WI","street":""}],"ownership":"coop","notes":"Central WI ag coop with propane division."},
    {"name":"France Propane Service","hqCity":"Wausau","hqState":"WI","website":None,"knownLocations":[{"city":"Wausau","state":"WI","street":""}],"ownership":"family","notes":"Independent WI propane marketer and WPGA member."},
    {"name":"Dale Gas and Oil","hqCity":"Dale","hqState":"WI","website":None,"knownLocations":[{"city":"Dale","state":"WI","street":""}],"ownership":"family","notes":"Fox Valley and Outagamie County propane dealer."},
    {"name":"Silver Valley Propane","hqCity":"Appleton","hqState":"WI","website":None,"knownLocations":[{"city":"Appleton","state":"WI","street":""}],"ownership":"private","notes":"Fox Valley propane supplier."},
    # VIRGINIA
    {"name":"Holtzman Corp","hqCity":"Mount Jackson","hqState":"VA","website":"https://holtzmancorp.com","knownLocations":[{"city":"Mount Jackson","state":"VA","street":""}],"ownership":"family","notes":"Holtzman Propane family-owned since 1972. Serves Augusta, Albemarle, Nelson, Rockbridge, Bath, Highland, Amherst counties across the Shenandoah Valley."},
    {"name":"Blue Ridge Petroleum","hqCity":"Ruckersville","hqState":"VA","website":None,"knownLocations":[{"city":"Ruckersville","state":"VA","street":""}],"ownership":"family","notes":"Family- and employee-owned Shenandoah Valley fuel and propane dealer."},
    {"name":"Tiger Fuel Company","hqCity":"Charlottesville","hqState":"VA","website":"https://tigerfuel.com","knownLocations":[{"city":"Charlottesville","state":"VA","street":""}],"ownership":"family","notes":"40-plus years serving Central VA with propane, heating oil, kerosene."},
    {"name":"Rockingham Petroleum","hqCity":"Harrisonburg","hqState":"VA","website":None,"knownLocations":[{"city":"Harrisonburg","state":"VA","street":""}],"ownership":"private","notes":"Southern States-brand petroleum affiliate in Harrisonburg / Rockingham County."},
    {"name":"H N Funkhouser and Co","hqCity":"Winchester","hqState":"VA","website":"https://www.hnfunkhouser.com","knownLocations":[{"city":"Winchester","state":"VA","street":"2150 S. Loudoun Street"}],"ownership":"family","notes":"Long-established Winchester fuel and propane supplier."},
    {"name":"Parker Oil and Propane","hqCity":"Emporia","hqState":"VA","website":"https://parkeroilcompany.com","knownLocations":[{"city":"Emporia","state":"VA","street":""},{"city":"South Hill","state":"VA","street":"1428 West Danville Street"}],"ownership":"family","notes":"Southside VA hometown energy. Serves VA and NC."},
    {"name":"Davenport Energy","hqCity":"Chatham","hqState":"VA","website":None,"knownLocations":[{"city":"Chatham","state":"VA","street":""},{"city":"Danville","state":"VA","street":""},{"city":"Martinsville","state":"VA","street":""}],"ownership":"family","notes":"Central, Southside and SW VA propane, gasoline, fuel oil dealer."},
    {"name":"Virginia Propane","hqCity":"Powhatan","hqState":"VA","website":"https://www.virginiapropane.com","knownLocations":[{"city":"Powhatan","state":"VA","street":""}],"ownership":"private","notes":"Central VA propane gas delivery serving Powhatan County region."},
    {"name":"Service Plus Propane","hqCity":"South Hill","hqState":"VA","website":"https://www.servicepluspropane.com","knownLocations":[{"city":"South Hill","state":"VA","street":""}],"ownership":"private","notes":"Southside VA propane dealer."},
    # COLORADO
    {"name":"Pioneer Propane Inc","hqCity":"Delta","hqState":"CO","website":"https://www.pioneerpropaneinc.co","knownLocations":[{"city":"Delta","state":"CO","street":""}],"ownership":"family","notes":"100-plus year local roots. Serves Delta, Montrose, Ouray, Mesa counties on the Western Slope."},
    {"name":"JC Propane","hqCity":"Delta","hqState":"CO","website":"https://jcpropane.com","knownLocations":[{"city":"Delta","state":"CO","street":""}],"ownership":"family","notes":"Serves Delta, Montrose, Ouray, San Miguel, Southern Mesa, Gunnison, Hinsdale counties."},
    {"name":"Mountain West Propane","hqCity":"Craig","hqState":"CO","website":"https://www.mountainwestpropane.com","knownLocations":[{"city":"Craig","state":"CO","street":""},{"city":"Steamboat Springs","state":"CO","street":""}],"ownership":"family","notes":"NW Colorado / Yampa Valley propane. 60-mile Craig service radius."},
    {"name":"Schrader Propane","hqCity":"Fort Collins","hqState":"CO","website":"https://schraderpropane.com","knownLocations":[{"city":"Fort Collins","state":"CO","street":""},{"city":"Steamboat Springs","state":"CO","street":""}],"ownership":"family","notes":"Front Range plus Yampa Valley propane dealer. Serves Hayden, Oak Creek, Phippsburg, Yampa, Toponas."},
    {"name":"Bailey Propane","hqCity":"Bailey","hqState":"CO","website":"https://baileypropane.com","knownLocations":[{"city":"Bailey","state":"CO","street":""}],"ownership":"family","notes":"Highway 285 corridor propane in Park County mountain communities."},
    {"name":"Glaser Energy Group","hqCity":"Monte Vista","hqState":"CO","website":"https://www.glaserenergygroup.com","knownLocations":[{"city":"Monte Vista","state":"CO","street":""}],"ownership":"family","notes":"San Luis Valley southern CO propane and petroleum distributor."},
    {"name":"Affordable Propane","hqCity":"Kiowa","hqState":"CO","website":"https://affordablepropanecolorado.com","knownLocations":[{"city":"Kiowa","state":"CO","street":""}],"ownership":"private","notes":"Eastern Front Range and Elbert County propane dealer."},
    {"name":"Polar Gas","hqCity":"Canon City","hqState":"CO","website":"https://polargas.com","knownLocations":[{"city":"Canon City","state":"CO","street":""}],"ownership":"private","notes":"Local propane services across Colorado Front Range south."},
    {"name":"Mile High Propane","hqCity":"Brighton","hqState":"CO","website":"https://milehighpropane.com","knownLocations":[{"city":"Brighton","state":"CO","street":""}],"ownership":"private","notes":"Denver metro north propane delivery."},
    {"name":"Global Propane Inc","hqCity":"Longmont","hqState":"CO","website":"https://globalpropaneinc.com","knownLocations":[{"city":"Longmont","state":"CO","street":""}],"ownership":"private","notes":"Colorado Front Range propane provider."},
    # WASHINGTON
    {"name":"VanderYacht Propane","hqCity":"Lynden","hqState":"WA","website":"https://www.vanderyachtpropane.com","knownLocations":[{"city":"Lynden","state":"WA","street":""},{"city":"Bellingham","state":"WA","street":""},{"city":"Freeland","state":"WA","street":""}],"ownership":"family","notes":"Family-owned dealer serving Whatcom, Skagit, Snohomish, San Juan and Island counties."},
    {"name":"Northwest Propane","hqCity":"Lynden","hqState":"WA","website":"https://www.nwpropane.net","knownLocations":[{"city":"Lynden","state":"WA","street":""},{"city":"Mount Vernon","state":"WA","street":"420 Suzanne Ln"},{"city":"Sedro-Woolley","state":"WA","street":""}],"ownership":"family","notes":"Locally owned since 1947 serving Whatcom and Skagit counties."},
    {"name":"Arrow Propane","hqCity":"Cheney","hqState":"WA","website":"https://www.arrowpropane.com","knownLocations":[{"city":"Cheney","state":"WA","street":""},{"city":"Spokane","state":"WA","street":""}],"ownership":"family","notes":"Eastern WA and Spokane-area propane delivery."},
    {"name":"Basin Propane","hqCity":"Moses Lake","hqState":"WA","website":None,"knownLocations":[{"city":"Moses Lake","state":"WA","street":"955 E Broadway Ave"}],"ownership":"family","notes":"Columbia Basin propane. Serves Warden, Marlin, Stratford, Ephrata, Wilson Creek, Othello, Soap Lake, Royal City, George, Odessa."},
    {"name":"Aspen Valley Propane","hqCity":"Colville","hqState":"WA","website":None,"knownLocations":[{"city":"Colville","state":"WA","street":""}],"ownership":"family","notes":"Locally owned Inland Northwest and Tri-County (Stevens, Ferry, Pend Oreille) dealer."},
    {"name":"Acme Fuel","hqCity":"Centralia","hqState":"WA","website":"https://bluestargas.com/acmefuel","knownLocations":[{"city":"Centralia","state":"WA","street":""}],"ownership":"private","notes":"Lewis County WA propane and heating oil; acquired by Blue Star Gas."},
    {"name":"Propane Northwest","hqCity":"Olympia","hqState":"WA","website":"https://propanenorthwest.com","knownLocations":[{"city":"Olympia","state":"WA","street":""}],"ownership":"private","notes":"WA and OR regional propane delivery."},
    {"name":"Skagit Farmers Supply","hqCity":"Burlington","hqState":"WA","website":None,"knownLocations":[{"city":"Burlington","state":"WA","street":""}],"ownership":"coop","notes":"Skagit Valley farmer cooperative with propane division."},
    {"name":"Eb and W Inc","hqCity":"Sedro-Woolley","hqState":"WA","website":None,"knownLocations":[{"city":"Sedro-Woolley","state":"WA","street":""}],"ownership":"family","notes":"Skagit County WA independent propane dealer."},
    {"name":"Permagas","hqCity":"Mount Vernon","hqState":"WA","website":None,"knownLocations":[{"city":"Mount Vernon","state":"WA","street":""}],"ownership":"private","notes":"Skagit Valley WA propane dealer."},
    # MASSACHUSETTS
    {"name":"Eastern Propane and Oil","hqCity":"Danvers","hqState":"MA","website":"https://eastern.com","knownLocations":[{"city":"Danvers","state":"MA","street":"131 Water St"},{"city":"North Easton","state":"MA","street":""}],"ownership":"private","notes":"Premier Northeast propane distributor covering NH, ME, MA, VT, RI."},
    {"name":"Fraticelli Oil and Propane","hqCity":"Worcester","hqState":"MA","website":"https://www.fraticellioilco.com","knownLocations":[{"city":"Worcester","state":"MA","street":""},{"city":"Leominster","state":"MA","street":""},{"city":"Winchendon","state":"MA","street":""}],"ownership":"family","notes":"90-plus years serving central MA and southern NH."},
    {"name":"Pioneer Oil and Propane","hqCity":"Fitchburg","hqState":"MA","website":"https://www.pioneeroilandpropane.com","knownLocations":[{"city":"Fitchburg","state":"MA","street":""}],"ownership":"family","notes":"Central MA propane and heating oil delivery."},
    {"name":"Medway Oil and Propane","hqCity":"Medway","hqState":"MA","website":"https://www.medwayoilpropane.com","knownLocations":[{"city":"Medway","state":"MA","street":"37 Broad St"}],"ownership":"family","notes":"Metrowest MA fuel and propane dealer since 1954."},
    {"name":"RJ McDonald Energy","hqCity":"Barre","hqState":"MA","website":"https://www.rjmenergy.com","knownLocations":[{"city":"Barre","state":"MA","street":""}],"ownership":"family","notes":"Central MA full-service family-owned fuel dealer since 1957."},
    {"name":"Dileo Gas","hqCity":"Worcester","hqState":"MA","website":"https://dileogas.com","knownLocations":[{"city":"Worcester","state":"MA","street":""}],"ownership":"family","notes":"30-plus years propane sales, service, installation in central MA."},
    {"name":"Petro Home Services","hqCity":"Plymouth","hqState":"MA","website":None,"knownLocations":[{"city":"Plymouth","state":"MA","street":"20 Holman Rd"},{"city":"Chelsea","state":"MA","street":"295 Eastern Ave"}],"ownership":"pe","notes":"Large Northeast full-service heating and propane chain with MA depots."},
    {"name":"Dunlaps Propane","hqCity":"Plymouth","hqState":"MA","website":"https://www.dunlapspropane.com","knownLocations":[{"city":"Plymouth","state":"MA","street":""},{"city":"Carver","state":"MA","street":""},{"city":"Kingston","state":"MA","street":""}],"ownership":"family","notes":"South Shore MA propane delivery (Plymouth County)."},
    {"name":"Tasha Fuels and Propane","hqCity":"Orleans","hqState":"MA","website":"https://www.tashafuelsandpropane.com","knownLocations":[{"city":"Orleans","state":"MA","street":""}],"ownership":"family","notes":"Cape Cod family-owned since 1994, 2nd and 3rd generation."},
    {"name":"Wrightington Gas","hqCity":"Plymouth","hqState":"MA","website":"https://www.wrightingtons.com","knownLocations":[{"city":"Plymouth","state":"MA","street":""}],"ownership":"family","notes":"Family-owned South Shore MA propane since 1950."},
    # ROUND 2 ADDITIONS
    # VIRGINIA
    {"name":"Suffolk Energies","hqCity":"Suffolk","hqState":"VA","website":"https://suffolkenergies.com","knownLocations":[{"city":"Suffolk","state":"VA","street":""},{"city":"Wakefield","state":"VA","street":""}],"ownership":"family","notes":"Griffin Oil and Propane, 2nd generation locally owned since 1938 (founder W.P. Griffin). Serves SE Virginia."},
    {"name":"A and B Propane","hqCity":"Chesapeake","hqState":"VA","website":"https://abpropane.com","knownLocations":[{"city":"Chesapeake","state":"VA","street":""}],"ownership":"family","notes":"3rd generation family-owned since 1974. Serves Norfolk, VA Beach, Portsmouth, Smithfield, Suffolk, Franklin, Isle of Wight, Windsor."},
    {"name":"NWP Energy","hqCity":"Windsor","hqState":"VA","website":"https://nwpenergy.com","knownLocations":[{"city":"Windsor","state":"VA","street":""}],"ownership":"family","notes":"Southeastern Virginia propane dealer."},
    # OHIO
    {"name":"Sunrise Cooperative","hqCity":"Fremont","hqState":"OH","website":"https://www.sunriseco-op.com","knownLocations":[{"city":"Fremont","state":"OH","street":""},{"city":"Bucyrus","state":"OH","street":""},{"city":"Kettlersville","state":"OH","street":""},{"city":"Norwalk","state":"OH","street":""},{"city":"Springfield","state":"OH","street":""},{"city":"Wilmington","state":"OH","street":""}],"ownership":"coop","notes":"Large Ohio ag cooperative. 6 energy offices plus 22 remote locations. Locally owned propane supplier since 1934."},
    {"name":"Auxier Gas","hqCity":"Batavia","hqState":"OH","website":"https://www.auxiergas.com","knownLocations":[{"city":"Batavia","state":"OH","street":""}],"ownership":"family","notes":"SW Ohio family propane dealer. Serves Cincinnati, Lebanon, Batavia, Goshen, New Richmond, Loveland, Indian Hill, Mt. Orab, Georgetown."},
    {"name":"Queen City Propane","hqCity":"Cincinnati","hqState":"OH","website":None,"knownLocations":[{"city":"Cincinnati","state":"OH","street":""}],"ownership":"private","notes":"Cincinnati-area propane dealer serving Dayton, Hamilton, Batavia, Georgetown region."},
    {"name":"Cincinnati Propane Inc","hqCity":"Miamiville","hqState":"OH","website":None,"knownLocations":[{"city":"Miamiville","state":"OH","street":""}],"ownership":"private","notes":"Cincinnati-area propane for commercial, residential, temporary heat, and diesel. 24/7 service."},
    {"name":"Lykins Propane","hqCity":"Milford","hqState":"OH","website":"https://lykinspropane.net","knownLocations":[{"city":"Milford","state":"OH","street":""},{"city":"Dayton","state":"OH","street":""}],"ownership":"family","notes":"SW Ohio Lykins Energy propane division serving Dayton and Cincinnati metro."},
    # WASHINGTON
    {"name":"Peninsula Propane","hqCity":"Tacoma","hqState":"WA","website":"https://www.peninsulapropanewa.com","knownLocations":[{"city":"Tacoma","state":"WA","street":""}],"ownership":"family","notes":"Full-service propane dealer in Tacoma serving South Puget Sound."},
    {"name":"Pacific Coast Energy","hqCity":"Tacoma","hqState":"WA","website":"https://pacificcoastenergy.net","knownLocations":[{"city":"Tacoma","state":"WA","street":""},{"city":"Battle Ground","state":"WA","street":""}],"ownership":"private","notes":"Tacoma- and Battle Ground-based propane sales and service."},
    {"name":"Puget Sound Petroleum","hqCity":"Tacoma","hqState":"WA","website":None,"knownLocations":[{"city":"Tacoma","state":"WA","street":""}],"ownership":"private","notes":"Locally owned petroleum/propane company established 2002 in Pierce County."},
    {"name":"Snider Petroleum","hqCity":"Puyallup","hqState":"WA","website":None,"knownLocations":[{"city":"Puyallup","state":"WA","street":""}],"ownership":"family","notes":"Merger of Snider and Puyallup Fuel. One of Pierce County's oldest independent petroleum/propane companies."},
    {"name":"Bunce Rental","hqCity":"Puyallup","hqState":"WA","website":"https://www.buncerental.com","knownLocations":[{"city":"Puyallup","state":"WA","street":""},{"city":"Tacoma","state":"WA","street":""},{"city":"Spanaway","state":"WA","street":""}],"ownership":"family","notes":"Propane sales in Puyallup, Tacoma, South Hill, Spanaway, Parkland, Greater South Sound."},
    # COLORADO
    {"name":"Ed Glaser Propane","hqCity":"Calhan","hqState":"CO","website":"https://edglaserpropane.com","knownLocations":[{"city":"Calhan","state":"CO","street":""}],"ownership":"family","notes":"Eastern Colorado family dealer since 1949 - 3 generations of Glasers. Serves Calhan / Elbert / Lincoln County area."},
    {"name":"CHS High Plains","hqCity":"Byers","hqState":"CO","website":"https://www.chshighplains.com","knownLocations":[{"city":"Byers","state":"CO","street":""}],"ownership":"coop","notes":"CHS regional coop serving Eastern Plains Colorado / NE Colorado with propane division."},
    {"name":"Rocky Mountain Propane","hqCity":"Denver","hqState":"CO","website":"http://rockymountainpropane.com","knownLocations":[{"city":"Denver","state":"CO","street":""}],"ownership":"family","notes":"Serving Colorado since 1964."},
    # MASSACHUSETTS
    {"name":"George Propane","hqCity":"Goshen","hqState":"MA","website":"https://www.georgepropane.com","knownLocations":[{"city":"Goshen","state":"MA","street":""}],"ownership":"family","notes":"Western Mass / Pioneer Valley propane leader. Serves Greenfield, Turners Falls, North Adams, Pittsfield, Adams."},
    {"name":"H A George and Sons Fuel","hqCity":"North Adams","hqState":"MA","website":"https://www.hageorge.com","knownLocations":[{"city":"North Adams","state":"MA","street":""}],"ownership":"family","notes":"Family-owned since 1948. Northern Berkshire and Southern Vermont propane / fuel."},
    {"name":"First Fuel and Propane","hqCity":"North Adams","hqState":"MA","website":"https://firstfuelandpropane.com","knownLocations":[{"city":"North Adams","state":"MA","street":""},{"city":"Pittsfield","state":"MA","street":""}],"ownership":"family","notes":"Berkshire County MA family-owned propane delivery."},
    {"name":"HL Propane","hqCity":"Pittsfield","hqState":"MA","website":"https://hlpropane.com","knownLocations":[{"city":"Pittsfield","state":"MA","street":""}],"ownership":"family","notes":"Berkshire County MA propane and Bennington VT delivery."},
    {"name":"Sandri Energy","hqCity":"Greenfield","hqState":"MA","website":None,"knownLocations":[{"city":"Greenfield","state":"MA","street":"400 Chapman St"}],"ownership":"family","notes":"Pioneer Valley / Greenfield-headquartered family fuel, propane, and convenience retailer (MEMA member)."},
    {"name":"ALL-GAS","hqCity":"Greenfield","hqState":"MA","website":"https://allgas.com","knownLocations":[{"city":"Greenfield","state":"MA","street":""}],"ownership":"private","notes":"Pioneer Valley propane, compressed gas, dry ice supplier."},
    {"name":"Pioneer Valley Oil and Propane","hqCity":"Springfield","hqState":"MA","website":"https://pioneervalleyoil.com","knownLocations":[{"city":"Springfield","state":"MA","street":""}],"ownership":"family","notes":"Pioneer Valley MA family-owned heating oil and propane dealer."},
]

results = []
dropped = []
for c in candidates:
    state_norms = set(n.lower() for n in by_state.get(c['hqState'], []))
    norm = normalize(c['name'])
    if not norm:
        continue
    if norm in state_norms:
        dropped.append((c['name'], c['hqState'], norm))
        continue
    results.append(c)

from collections import Counter
cnt = Counter(c['hqState'] for c in results)
print("Per-state new:", dict(cnt))
print("Total new:", len(results))
print("Dropped as dups:", len(dropped))
for d in dropped:
    print("  DUP:", d)

out = {
    "batch": "mid_density_va_oh_ma_wi_co_wa",
    "generated": "2026-04-11",
    "companies": results
}

with open('C:/Users/Danie/Downloads/se-propane-market-map/data/discovery_results_batch_mid_density.json','w') as f:
    json.dump(out, f, indent=2)

print("WROTE: C:/Users/Danie/Downloads/se-propane-market-map/data/discovery_results_batch_mid_density.json")
