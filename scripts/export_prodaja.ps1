$ErrorActionPreference = 'Stop'
$root = 'C:\Users\matjaz.muzar\Documents\GitHub\FINES_RabljenaOprema'
$src  = Join-Path $root 'ZALOGA - RABLJENA_OPREMA_2107081500FIZL.xlsx'
$outDir = Join-Path $root 'data'
$outProdaja = Join-Path $outDir 'rbo_prodaja.csv'
$outVeza = Join-Path $outDir 'ln_rbo_oprema_prodaja.csv'

$warn = New-Object System.Collections.Generic.List[string]
$inv = [Globalization.CultureInfo]::InvariantCulture

function Q($v) { if ([string]$v -eq '') { return '' }; '"' + ([string]$v).Replace('"','""') + '"' }
function Txt($cell) { (([string]$cell.Text).Trim() -replace "`r?`n", ' ') }

# Denarni znesek: stevilska celica ali besedilo "3.390 EUR"
function Money($cell, $row, $name) {
    $v = $cell.Value2
    if ($null -eq $v -or ([string]$v).Trim() -eq '') { return '' }
    if ($v -is [double]) { return [Math]::Round($v, 2).ToString($inv) }
    $t = ([string]$v) -replace '[€\s]', '' -replace '\.', '' -replace ',', '.'
    $d = 0.0
    if ([double]::TryParse($t, [Globalization.NumberStyles]::Float, $inv, [ref]$d)) { return [Math]::Round($d, 2).ToString($inv) }
    $warn.Add("Vrstica ${row}: $name ni znesek '$v' (pusto)")
    return ''
}

# Rabat v odstotkih (0.6 ali "60%" -> 60)
function Percent($cell, $row) {
    $v = $cell.Value2
    if ($null -eq $v -or ([string]$v).Trim() -eq '') { return '' }
    if ($v -is [double]) { return [Math]::Round($v * 100, 2).ToString($inv) }
    $t = ([string]$v) -replace '[%\s]', '' -replace ',', '.'
    $d = 0.0
    if ([double]::TryParse($t, [Globalization.NumberStyles]::Float, $inv, [ref]$d)) { return $d.ToString($inv) }
    $warn.Add("Vrstica ${row}: rabat '$v' (pusto)")
    return ''
}

function ParseDate($cell, $row) {
    $v = $cell.Value2
    if ($null -eq $v -or ([string]$v).Trim() -eq '') { return '' }
    if ($v -is [double]) { return [DateTime]::FromOADate($v).ToString('yyyy-MM-dd') }
    $t = ([string]$v).Trim()
    $d = [DateTime]::MinValue
    $fmts = [string[]]@('d.M.yyyy','dd.MM.yyyy','d.M.yy','dd.MM.yy','yyyy-MM-dd')
    if ([DateTime]::TryParseExact($t, $fmts, $inv, 'AllowWhiteSpaces', [ref]$d)) { return $d.ToString('yyyy-MM-dd') }
    $warn.Add("Vrstica ${row}: neprepoznan datum prodaje '$t' (pusto)")
    return ''
}

# Garancija v mesecih: "brez" -> 0, "1 leto" -> 12, "6 mesecev" -> 6
function Garancija($cell, $row) {
    $t = (Txt $cell).ToLower()
    if ($t -eq '') { return '' }
    if ($t -eq 'brez') { return 0 }
    if ($t -match '^(\d+)\s*(leto|leti|leta|let)$') { return [int]$Matches[1] * 12 }
    if ($t -match '^(\d+)\s*mes') { return [int]$Matches[1] }
    $warn.Add("Vrstica ${row}: garancija '$t' (pusto)")
    return ''
}

$statusi = '0. NI ZA PRODAJO','1. NI UREJENO ZA PRODAJO','2. NEPRODANO','3. PRODANO','4. POSOJENO'

$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
try {
    $wb = $xl.Workbooks.Open($src, 0, $true)
    $ws = $wb.Worksheets.Item('POPIS')
    $last = $ws.UsedRange.Row + $ws.UsedRange.Rows.Count - 1
    $prodaja = New-Object System.Collections.Generic.List[string]
    $veza = New-Object System.Collections.Generic.List[string]
    $prodaja.Add('id_prodaja,imenovani_prodajalec,garancijski_rok_meseci,cena_nove,rabat_procent,prodajna_cena,datum_prodaje,komentar_ob_prodaji,status_prodaje')
    $veza.Add('id_prodaja,id_oprema')
    $idProdaja = 0
    for ($r = 6; $r -le $last; $r++) {
        $idOprema = (Txt $ws.Cells.Item($r,1))
        if ($idOprema -eq '' -or (Txt $ws.Cells.Item($r,10)) -eq '') { continue }

        $status = (Txt $ws.Cells.Item($r,22)) -replace '\s+', ' '
        if ($status -ne '' -and $statusi -notcontains $status) { $warn.Add("Vrstica ${r}: neznan status '$status' (pusto)"); $status = '' }

        $vals = @(
            (Txt $ws.Cells.Item($r,15)),
            (Garancija $ws.Cells.Item($r,16) $r),
            (Money $ws.Cells.Item($r,17) $r 'Cena_nove'),
            (Percent $ws.Cells.Item($r,18) $r),
            (Money $ws.Cells.Item($r,19) $r 'Prodajna_cena'),
            (ParseDate $ws.Cells.Item($r,20) $r),
            (Txt $ws.Cells.Item($r,21)),
            $status
        )
        if (-not ($vals | Where-Object { [string]$_ -ne '' })) { $warn.Add("Oprema ID ${idOprema}: brez prodajnih podatkov (ni zapisa)"); continue }

        $idProdaja++
        $prodaja.Add(((@($idProdaja) + $vals | ForEach-Object { Q $_ }) -join ','))
        $veza.Add("$idProdaja,$idOprema")
    }
    $wb.Close($false)
} finally {
    $xl.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
}

$enc = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($outProdaja, ($prodaja -join "`n") + "`n", $enc)
[IO.File]::WriteAllText($outVeza, ($veza -join "`n") + "`n", $enc)
"prodaja: $($prodaja.Count - 1), povezav: $($veza.Count - 1)"
$warn
