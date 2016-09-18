<?php

$fileURL = $_REQUEST["input"];
if (strval(intval($fileURL)) === $fileURL) $fileURL = "http://www.pixeljoint.com/pixelart/".$fileURL.".htm";
if (strpos($fileURL, "://") === false) $fileURL = "http://".$fileURL;
$info = array();
$info["title"] = $fileURL;
$info["artist"] = null;
$info["imageUrl"] = $fileURL;
if (empty($fileURL)) $info["error"] = "Cannot read image!";
else
{
  $content = file_get_contents($fileURL);
  $image = @imagecreatefromstring($content);
  if ($image === false)
  {
    if (strpos($fileURL, "pixeljoint.com/pixelart/") !== false)
    {
      $imgPos = strpos($content, "id='mainimg' src=\"");
      if ($imgPos !== false)
      {
        $imgPos += 18;
        $endPos = strpos($content, '" alt="', $imgPos);
        $url = "http://www.pixeljoint.com" . substr($content, $imgPos, $endPos - $imgPos);
        $imgPos = $endPos + 7;
        $endPos = strpos($content, '" width', $imgPos);
        $info["title"] = substr($content, $imgPos, $endPos - $imgPos);
        
        $imgPos = strpos($content, '"_top"', strpos($content, "Pixel Artist: </strong>")) + 7;
        $endPos = strpos($content, "</a>", $imgPos);
        $info["artist"] = substr($content, $imgPos, $endPos - $imgPos);
        
        $content = file_get_contents($url);
        $info["content"] = base64_encode($content);
      }
      else
      {
        $info["error"] = "Cannot read image!";
      }
    }
    else
    {
      $info["error"] = "Cannot read image!";
    }
  }
  else
  {
    $info["content"] = base64_encode($content);
  }
}
echo(json_encode((object)$info));

?>