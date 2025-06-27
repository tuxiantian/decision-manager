# count-lines.ps1
$jsFiles = Get-ChildItem -Path .\src -Recurse -Include *.js, *.jsx
$results = @()

foreach ($file in $jsFiles) {
    $lines = (Get-Content $file.FullName).Count
    $results += [PSCustomObject]@{
        File = $file.FullName
        Lines = $lines
    }
}

$results | Format-Table -AutoSize
$total = ($results | Measure-Object -Property Lines -Sum).Sum
Write-Output "`nTotal lines: $total"