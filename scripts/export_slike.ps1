$ErrorActionPreference = 'Stop'
$root = 'C:\Users\matjaz.muzar\Documents\GitHub\FINES_RabljenaOprema'
$src  = Join-Path $root 'ZALOGA - RABLJENA_OPREMA_2107081500FIZL.xlsx'
$out  = Join-Path $root 'data\rbo_slike.csv'

$vrste = 'Predstavna','Slika1','Slika2','Slika3','Slika4','Slika5','Slika6'
$warn = New-Object System.Collections.Generic.List[string]
$seen = @{}
$maxId = 0

function Q($v) { if ([string]$v -eq '') { return '' }; '"' + ([string]$v).Replace('"','""') + '"' }

$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
try {
    $wb = $xl.Workbooks.Open($src, 0, $true)
    $lo = $wb.Worksheets.Item('TabelaSlike').ListObjects.Item('slike_tabela')
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('id,id_oprema,vrsta_slike,ime_slike')
    foreach ($row in $lo.DataBodyRange.Rows) {
        $id    = ([string]$row.Cells.Item(1,1).Text).Trim()
        $idOpr = ([string]$row.Cells.Item(1,2).Text).Trim()
        $vrsta = ([string]$row.Cells.Item(1,3).Text).Trim()
        $ime   = ([string]$row.Cells.Item(1,4).Text).Trim()
        if ($id -eq '' -and $idOpr -eq '') { continue }
        $v = $vrste | Where-Object { $_ -ieq $vrsta }
        if (-not $v) { $warn.Add("Slika ID ${id}: neznana vrsta '$vrsta' (izpuščeno)"); continue }
        $key = "$idOpr|$v"
        if ($seen.ContainsKey($key)) { $warn.Add("Slika ID ${id}: podvojena $v za opremo $idOpr (izpuščeno)"); continue }
        $seen[$key] = 1
        $lines.Add((@($id, $idOpr, $v, $ime) | ForEach-Object { Q $_ }) -join ',')
        $maxId = [Math]::Max($maxId, [int]$id)
    }

    # Predstavne slike: list POPIS, stolpec C (Predstavna slika); ID-ji se nadaljujejo za slike_tabela
    $ws = $wb.Worksheets.Item('POPIS')
    $last = $ws.UsedRange.Row + $ws.UsedRange.Rows.Count - 1
    for ($r = 6; $r -le $last; $r++) {
        $idOpr = ([string]$ws.Cells.Item($r,1).Text).Trim()
        $ime   = ([string]$ws.Cells.Item($r,3).Text).Trim()
        if ($idOpr -eq '' -or $ime -eq '') { continue }
        if ($ime -notmatch "^$idOpr\s*-") { $warn.Add("Oprema ${idOpr}: ime predstavne slike '$ime' ne ustreza ID-ju") }
        $key = "$idOpr|Predstavna"
        if ($seen.ContainsKey($key)) { $warn.Add("Oprema ${idOpr}: podvojena predstavna slika (izpuščeno)"); continue }
        $seen[$key] = 1
        $maxId++
        $lines.Add((@($maxId, $idOpr, 'Predstavna', $ime) | ForEach-Object { Q $_ }) -join ',')
    }
    $wb.Close($false)
} finally {
    $xl.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
}

[IO.File]::WriteAllText($out, ($lines -join "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))
"Slik: $($lines.Count - 1) -> $out"
$warn
