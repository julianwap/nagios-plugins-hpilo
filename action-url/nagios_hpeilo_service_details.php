<?php
/*
	HPE ILO SNMP-Query Frontend
	
	Rewritten by Julian July 2023
	from Original source: https://github.com/HewlettPackard/nagios-plugins-hpilo

*/
$config = array(
	# If false, the user can only query hosts from the hosts-Array
	"allow_foreign_hosts" => false,
	
	# Frontend uses Ajax-Requests to load the pages
	"use_ajax" => true,
	
	# Known hosts in format "hostname" => "display_name"
	"hosts" => array(
		"host01.example.local" => "Host01",
		"host02.example.local" => "Host02",
	),
	
	# Known tab-pages
	"pages" => array(
		array("id" => 0, "text" => "Summary"),
		array("id" => 1, "text" => "Power Supplies"),
		array("id" => 2, "text" => "Fans"),
		array("id" => 3, "text" => "Temperatures"),
		array("id" => 4, "text" => "Storage"),
		array("id" => 5, "text" => "Memory"),
		array("id" => 6, "text" => "CPU"),
		array("id" => 7, "text" => "Network"),
	),
);

$v = array(
	"ip" => isset($_REQUEST["ip"]) ? $_REQUEST["ip"] : "",
	"comm" => isset($_REQUEST["comm"]) ? $_REQUEST["comm"] : "public",
	"id" => isset($_REQUEST["id"]) ? intval($_REQUEST["id"]) : 0,
);

$result = 'var jData = "not-allowed";';
if(empty($v["ip"])) {
	foreach($config["hosts"] as $my_hostname => $my_display_name) {
		$v["ip"] = $my_hostname;
		break;
	}
}
if($config["allow_foreign_hosts"] || isset($config["hosts"][$v["ip"]])) {
	$cmd = escapeshellcmd("./nagios_hpeilo_engine -H " . escapeshellarg($v["ip"]) . " -C " . escapeshellarg($v["comm"]) . " -o " . escapeshellarg($v["id"]) . ($v["id"] > 0 ? " -J" : ""));
	$cmd_ret = exec($cmd, $output);
	//var_dump($output);exit;
	$result = join("", $output);
	
	if($v["id"] <= 0) {
		$status_arr = explode(';', $result);
		$result = "var serviceID=0,jData='" . json_encode($status_arr) . "';";
	}
}

$make_link = function($field, $field_val, $text) use($v) {
	$q = http_build_query(array_merge($v, array(
		$field => $field_val,
	)));
	return '<a href="?' . $q . '" class="navigate' . ($field_val == $v[$field] ? ' active' : '') . '">' . $text . '</a>';
};

$viewheader = 'ILO Overview-Data for Host&emsp;&raquo;&nbsp;<a href="https://' . urlencode($v["ip"]) . '" target="_blank">' . htmlspecialchars($v["ip"]) . '</a>&nbsp;&laquo;';

$viewmenuhosts = '<span>&raquo;&nbsp;ILO-Hosts</span>';
foreach($config["hosts"] as $my_hostname => $my_display_name)
	$viewmenuhosts .= $make_link("ip", $my_hostname, $my_display_name);
$viewmenuhosts .= '<div id="loader"><svg class="hpe-loader" width="107px" height="32px" viewBox="0 0 107 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Loading" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Element-path" transform="translate(-67.000000, -20.000000)"><polyline id="Element" stroke="#01A982" stroke-width="8" points="119 48 170 48 170 24 71 24 71 48 119 48"></polyline><polyline id="Element-loading" stroke="#333333" stroke-width="8" points="119 48 170 48 170 24 71 24 71 48 119 48" stroke-dasharray="123"><animate attributeName="stroke-dashoffset" from="0" to="245" dur="1s" calcMode="linear" repeatCount="indefinite"></animate></polyline></g></g></svg></div>';

$viewmenupages = '';
foreach($config["pages"] as $my_page)
	$viewmenupages .= $make_link("id", $my_page["id"], $my_page["text"]);

if(isset($_REQUEST["putraw"]) && $_REQUEST["putraw"] == '1')
{
	header("Content-type: application/javascript; charset=utf-8");
	echo($result . 'var in_viewmenuhosts = `' . $viewmenuhosts . '`; var in_viewmenupages = `' . $viewmenupages . '`; var in_viewheader = `' . $viewheader . '`;'); exit;
}
?>
<!DOCTYPE HTML>
<html>
	<head>
		<title>iLO-q: <?php echo($v["ip"]); ?></title>
		<link rel="stylesheet" href="hpeilo.style.css" />
		<script type="text/javascript" src="hpeilo.parser.js"></script>
		<script>ILOParser.evalSource = `<?php echo($result); ?>`;ILOParser.useAjax = <?php echo($config["use_ajax"] ? "true" : "false"); ?>;</script>
	</head>
	<body>
		<div class="tabcontrol vertical">
			<div class="tab" id="viewmenuhosts"><?php echo($viewmenuhosts); ?></div>
			<div class="tabcontent">
				<h2 style="text-align:center" id="viewheader"><?php echo($viewheader); ?></h2>
				<div class="tabcontrol">
					<div class="tab" id="viewmenupages"><?php echo($viewmenupages); ?></div>
					<div class="tabcontent" id="viewframe">
					</div>
				</div>
			</div>
		</div>
	</body>
</html>
