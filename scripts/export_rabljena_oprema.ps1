$ErrorActionPreference = 'Stop'
$root = 'C:\Users\matjaz.muzar\Documents\GitHub\FINES_RabljenaOprema'
$src  = Join-Path $root 'ZALOGA - RABLJENA_OPREMA_2107081500FIZL.xlsx'
$outDir = Join-Path $root 'data'
New-Item -ItemType Directory -Force $outDir | Out-Null
$out = Join-Path $outDir 'rbo_oprema.csv'

$cols = 'id','datum_prejema','kolicina','em','koda','serijska_stevilka','leto_proizvodnje','skupina_opreme','oprema_naziv','lastnistvo','skladisce','komentar','ocena'
$warn = New-Object System.Collections.Generic.List[string]

function Q($v) { if ([string]$v -eq '') { return '' }; '"' + ([string]$v).Replace('"','""') + '"' }

function ParseDate($cell, $row) {
    $v = $cell.Value2
    if ($null -eq $v -or [string]$v -eq '') { return '' }
    if ($v -is [double]) { return [DateTime]::FromOADate($v).ToString('yyyy-MM-dd') }
    $t = ([string]$v).Trim()
    $d = [DateTime]::MinValue
    $fmts = [string[]]@('d.M.yyyy','dd.MM.yyyy','d. M. yyyy','d.M.yy','yyyy-MM-dd')
    if ([DateTime]::TryParseExact($t, $fmts, [Globalization.CultureInfo]::InvariantCulture, 'AllowWhiteSpaces', [ref]$d)) { return $d.ToString('yyyy-MM-dd') }
    $warn.Add("Vrstica ${row}: neprepoznan datum '$t' (pusto)")
    return ''
}

function Num($cell, $row, $name) {
    $t = ([string]$cell.Text).Trim()
    if ($t -eq '') { return '' }
    $n = 0
    if ([int]::TryParse($t, [ref]$n)) { return $n }
    $warn.Add("Vrstica ${row}: $name ni število '$t' (pusto)")
    return ''
}

$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
try {
    $wb = $xl.Workbooks.Open($src, 0, $true)
    $ws = $wb.Worksheets.Item('POPIS')
    $last = $ws.UsedRange.Row + $ws.UsedRange.Rows.Count - 1
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add(($cols -join ','))
    for ($r = 6; $r -le $last; $r++) {
        $id = ([string]$ws.Cells.Item($r,1).Text).Trim()
        $naziv = ([string]$ws.Cells.Item($r,10).Text).Trim()
        if ($id -eq '' -and $naziv -eq '') { continue }
        if ($naziv -eq '') { $warn.Add("Vrstica ${r}: ID $id nima naziva (izpuščeno)"); continue }
        $vals = @(
            (Num $ws.Cells.Item($r,1) $r 'ID'),
            (ParseDate $ws.Cells.Item($r,2) $r),
            (Num $ws.Cells.Item($r,4) $r 'Kol'),
            ([string]$ws.Cells.Item($r,5).Text).Trim(),
            ([string]$ws.Cells.Item($r,6).Text).Trim(),
            ([string]$ws.Cells.Item($r,7).Text).Trim(),
            (Num $ws.Cells.Item($r,8) $r 'Leto'),
            ([string]$ws.Cells.Item($r,9).Text).Trim(),
            $naziv,
            ([string]$ws.Cells.Item($r,11).Text).Trim(),
            ([string]$ws.Cells.Item($r,12).Text).Trim(),
            (([string]$ws.Cells.Item($r,13).Text).Trim() -replace "`r?`n", ' '),
            (Num $ws.Cells.Item($r,14) $r 'Ocena')
        )
        if ($vals[2] -eq '') { $vals[2] = 1 }   # kolicina
        $lines.Add((($vals | ForEach-Object { Q $_ }) -join ','))
    }
    $wb.Close($false)
} finally {
    $xl.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
}

[IO.File]::WriteAllText($out, ($lines -join "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))
"Zapisov: $($lines.Count - 1) -> $out"
$warn
