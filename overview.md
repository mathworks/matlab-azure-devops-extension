This extension enables you to build and test your MATLAB&reg; project as part of your pipeline. For example, you can automatically identify any code issues in your project, run tests and generate test and coverage artifacts, and package your files into a toolbox.

To run your pipeline using this extension, install the extension to your Azure&reg; DevOps organization. To [install the extension](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=azure-devops&tabs=browser), click the **Get it free** button at the top of this page. You can use the extension with self-hosted and Microsoft&reg;-hosted [agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser).

## Overview of Tasks
To run MATLAB in your pipeline, use these tasks when you define your pipeline in a file named `azure-pipelines.yml` in the root of your repository:

* To set up your pipeline with a specific version of MATLAB, use the [Install MATLAB](#install-matlab) task.
* To run a MATLAB build using the MATLAB build tool, use the [Run MATLAB Build](#run-matlab-build) task.
* To run MATLAB and Simulink&reg; tests and generate artifacts, use the [Run MATLAB Tests](#run-matlab-tests) task.
* To run MATLAB scripts, functions, and statements, use the [Run MATLAB Command](#run-matlab-command) task.

## Examples

### Run MATLAB Build on Self-Hosted Agent
Ue the latest release of MATLAB on a self-hosted agent to run a MATLAB build task named `mytask`, specified in a file named `buildfile.m` in the root of your repository, as well as all the tasks on which it depends. To use the latest release of MATLAB on the agent, specify the **Install MATLAB** task in your pipeline. (You do not need to specify this task if the agent already has the latest release of MATLAB installed and added to the path.) To run the MATLAB build, specify the **Run MATLAB Build** task.

```YAML
pool: myPool
steps:
  - task: InstallMATLAB@1
  - task: RunMATLABBuild@1
    inputs:
      tasks: mytask
``` 

### Run MATLAB Tests on Microsoft-Hosted Agent
Use the latest release of MATLAB on a Microsoft-hosted agent to run the tests in your [MATLAB project](https://www.mathworks.com/help/matlab/projects.html) and generate test results in PDF and JUnit-style XML formats and code coverage results in Cobertura XML format. Use tasks to publish the generated artifacts to Azure Pipelines once the test run is complete. To install the latest release of MATLAB on the agent, specify the **Install MATLAB** task in your pipeline. To run the tests and generate the artifacts, specify the **Run MATLAB Tests** task.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
  - task: InstallMATLAB@1
  - task: RunMATLABTests@1
    inputs:
      testResultsPDF: test-results/results.pdf
      testResultsJUnit: test-results/results.xml
      codeCoverageCobertura: code-coverage/coverage.xml
  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: test-results/results.pdf
  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFiles: test-results/results.xml
  - task: PublishCodeCoverageResults@1
    inputs:
      codeCoverageTool: Cobertura
      summaryFileLocation: code-coverage/coverage.xml
``` 

 You can access the artifacts in the pipeline summary window:

- To download the PDF test results report, follow the **published** link. 
- To view the JUnit test results report, open the **Tests** tab.
- To view the Cobertura code coverage report, open the **Code Coverage** tab.


### Run MATLAB Script on Microsoft-Hosted Agent
Use MATLAB R2023b on a Microsoft-hosted agent to run the commands in a file named `myscript.m` in the root of your repository. To install the specified release of MATLAB on the agent, specify the **Install MATLAB** task in your pipeline. To run the script, specify the **Run MATLAB Command** task.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
  - task: InstallMATLAB@1
    inputs:
      release: R2023b
  - task: RunMATLABCommand@1
    inputs:
      command: myscript
```

### Specify MATLAB Version on Self-Hosted Agent
When you use the **Run MATLAB Build**, **Run MATLAB Tests**, or **Run MATLAB Command** task in your pipeline, the agent uses the topmost MATLAB version on the system path. The task fails if the agent cannot find any version of MATLAB on the path.

In R2021a and later, you can use the **Install MATLAB** task to prepend your preferred version of MATLAB to the `PATH` system environment variable of the agent. You can also add your preferred version to the path without using the **Install MATLAB** task. For example, prepend MATLAB R2020b, which the **Install MATLAB** task does not support, to the path and use it to run your script. The step depends on your operating system and MATLAB root folder.

```YAML
pool: myPool
steps:
  - powershell: Write-Host '##vso[task.prependpath]C:\Program Files\MATLAB\R2020b\bin'  # Windows agent
# - bash: echo '##vso[task.prependpath]/usr/local/MATLAB/R2020b/bin'  # Linux agent
  - task: RunMATLABCommand@1
    inputs:
      command: myscript
```

### Install Transformation Product on Microsoft-Hosted Agent
Before you run MATLAB code or Simulink models on a Microsoft-hosted agent, first use the [Install MATLAB](#install-matlab) task. The task installs your specified MATLAB release (R2021a or later) on a Linux&reg; virtual machine. If you do not specify a release, the task installs the latest release of MATLAB.

For example, install MATLAB R2023b on a Microsoft-hosted agent, and then use the **Run MATLAB Command** task to run the commands in your script.

```YAML
pool:
  vmImage: ubuntu-latest

variables:
- group: MLM_LICENSE_TOKEN

steps:
- task: InstallMATLAB@1
  inputs:
    products: MATLAB_Compiler
- task: RunMATLABCommand@1
  inputs:
    command: compiler.build.standaloneApplication("myfun.m")
  env:
    MLM_LICENSE_TOKEN: $(MLM_LICENSE_TOKEN)
```

## Tasks
You can access the extension tasks and add them to your pipeline when you edit your pipeline in Azure DevOps. 

![tasks](https://user-images.githubusercontent.com/48831250/193909715-1c90eb94-d89d-458d-80bc-2fee4c20c760.png)

### Install MATLAB
Use the **Install MATLAB** task to run MATLAB code and Simulink models with a specific version of MATLAB. When you specify this task as part of your pipeline, the task installs your preferred MATLAB release (R2021a or later) on a Linux&reg;, Windows&reg;, or macOS agent and prepends it to the `PATH` system environment variable. If you do not specify a release, the task installs the latest release of MATLAB. The task supports self-hosted and Microsoft-hosted agents:

- Self-hosted agent — If the agent does not have MATLAB installed, the task installs it and preprends it to the path. f the agent has MATLAB installed, the  task only prepends MATLAB to the path.
- Microsoft-hosted agent — The task installs MATLAB and prepends it to the path.

Specify the task in your pipeline YAML using the `InstallMATLAB` key. The task accepts optional arguments.

| Argument  | Description |
|-----------|-------------|
| `release` | <p>(Optional) MATLAB release to install. You can specify R2021a or a later release. By default, the value of `release` is `latest`, which corresponds to the latest release of MATLAB.<p/><p>**Example**: `release: R2023b`<br/>**Example**: `release: latest`</p>
| `products` | <p>(Optional) Products to install in addition to MATLAB, specified as a list of product names separated by spaces. You can specify `products` to install most MathWorks&reg; products and support packages. For example, `products: Deep_Learning_Toolbox` installs Deep Learning Toolbox&trade; in addition to MATLAB.</p><p>The task uses [MATLAB Package Manager](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md) (`mpm`) to install products. For a list of supported products and their correctly formatted names, see [Product Installation Options](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md#product-installation-options).</p><p>**Example**: `products: Simulink`</br>**Example:** `products: Simulink Deep_Learning_Toolbox`</p>

#### Product Licensing


### Run MATLAB Build
Use the **Run MATLAB Build** task to run a build using the MATLAB build tool. Starting in R2022b, you can use this task to run the MATLAB build tasks specified in a file named `buildfile.m` in the root of your repository. 

Specify the task in your pipeline YAML using the `RunMATLABBuild` key. The task accepts optional arguments.

Argument                  | Description
------------------------- | ---------------
`tasks`                   | <p>(Optional) MATLAB build tasks to run, specified as a list of task names separated by spaces. If a task accepts arguments, enclose them in parentheses. If you do not specify `tasks`, the task runs the default tasks in `buildfile.m` as well as all the tasks on which they depend.</p><p>MATLAB exits with exit code 0 if the tasks run without error. Otherwise, MATLAB terminates with a nonzero exit code, which causes the task to fail.<p/><p>**Example:** `tasks: test`</br>**Example:** `tasks: compile test`</br>**Example:** `tasks: check test("myFolder",OutputDetail="concise") archive("source.zip")`</p>
`buildOptions`           | <p>(Optional) MATLAB build options, specified as a list of options separated by spaces. The task supports the same [options](https://www.mathworks.com/help/matlab/ref/buildtool.html#mw_50c0f35e-93df-4579-963d-f59f2fba1dba) that you can pass to the `buildtool` command.<p/><p>**Example:** `buildOptions: -continueOnFailure`<br/>**Example:** `buildOptions: -continueOnFailure -skip test`</p>
`startupOptions`         | <p>(Optional) MATLAB startup options, specified as a list of options separated by spaces. For more information about startup options, see [Commonly Used Startup Options](https://www.mathworks.com/help/matlab/matlab_env/commonly-used-startup-options.html).<p/><p>Using this argument to specify the `-batch` or `-r` option is not supported.<p/><p>**Example:** `startupOptions: -nojvm`<br/>**Example:** `startupOptions: -nojvm -logfile output.log`</p>

When you use this task, a file named `buildfile.m` must be in the project root directory. For more information about the build tool, see [Overview of MATLAB Build Tool](https://www.mathworks.com/help/matlab/matlab_prog/overview-of-matlab-build-tool.html).


### Run MATLAB Tests
Use the **Run MATLAB Tests** task to run tests authored using the MATLAB unit testing framework or Simulink Test&trade; and generate test and coverage artifacts.

By default, the task includes any files in your project that have a `Test` label. If your pipeline does not use a MATLAB project, or if it uses a MATLAB release before R2019a, then the task includes all tests in the root of your repository and in any of its subfolders. The task fails if any of the included tests fail.

Specify the **Run MATLAB Tests** task in your pipeline YAML using the `RunMATLABTests` key. The task lets you customize your test run using optional arguments. For example, you can add folders to the MATLAB search path, control which tests to run, and generate various artifacts.

Argument                  | Description
------------------------- | ---------------
`sourceFolder`            | <p>(Optional) Location of the folder containing source code, relative to the project root folder. The specified folder and its subfolders are added to the top of the MATLAB search path. If you specify `sourceFolder` and then generate a coverage report, the task uses only the source code in the specified folder and its subfolders to generate the report. You can specify multiple folders using a colon-separated or semicolon-separated list.<p/><p>**Example:** `sourceFolder: source`<br/>**Example:** `sourceFolder: source/folderA; source/folderB`</p>
`selectByFolder`          | <p>(Optional) Location of the folder used to select test suite elements, relative to the project root folder. To create a test suite, the task uses only the tests in the specified folder and its subfolders. You can specify multiple folders using a colon-separated or semicolon-separated list.<p/><p>**Example:** `selectByFolder: test`<br/>**Example:** `selectByFolder: test/folderA; test/folderB`</p>
`selectByTag`             | <p>(Optional) Test tag used to select test suite elements. To create a test suite, the task uses only the test elements with the specified tag.<p/><p>**Example:** `selectByTag: Unit`</p>
`strict`                  | <p>(Optional) Option to apply strict checks when running tests, specified as `false` or `true`. By default, the value is `false`. If you specify a value of `true`, the task generates a qualification failure whenever a test issues a warning.<p/><p>**Example:** `strict: true`</p>
`useParallel`              | <p>(Optional) Option to run tests in parallel, specified as `false` or `true`. By default, the value is `false` and tests run in serial. If the test runner configuration is suited for parallelization, you can specify a value of `true` to run tests in parallel. This argument requires a Parallel Computing Toolbox&trade; license.</p><p>**Example:** `useParallel: true`</p>
`outputDetail`            | <p>(Optional) Amount of event detail displayed for the test run, specified as `none`, `terse`, `concise`, `detailed`, or `verbose`. By default, the task displays failing and logged events at the `detailed` level and test run progress at the `concise` level.<p></p>**Example:** `outputDetail: verbose`</p>
`loggingLevel`            | <p>(Optional) Maximum verbosity level for logged diagnostics included for the test run, specified as `none`, `terse`, `concise`, `detailed`, or `verbose`. By default, the task includes diagnostics logged at the `terse` level.<p></p>**Example:** `loggingLevel: detailed`</p> 
`testResultsPDF`          | <p>(Optional) Path to write the test results in PDF format. On macOS platforms, this argument is supported in MATLAB R2020b and later.</p><p>**Example:** `testResultsPDF: test-results/results.pdf`</p>
`testResultsJUnit`        | <p>(Optional) Path to write the test results in JUnit-style XML format.</p><p>**Example:** `testResultsJUnit: test-results/results.xml`</p>
`testResultsSimulinkTest` | <p>(Optional) Path to export Simulink Test Manager results in MLDATX format. This argument requires a Simulink Test license and is supported in MATLAB R2019a and later.</p><p>**Example:** `testResultsSimulinkTest: test-results/results.mldatx`</p>
`codeCoverageCobertura`   | <p>(Optional) Path to write the code coverage results in Cobertura XML format.</p><p>**Example:** `codeCoverageCobertura: code-coverage/coverage.xml`</p>
`modelCoverageCobertura`  | <p>(Optional) Path to write the model coverage results in Cobertura XML format. This argument requires a Simulink Coverage&trade; license and is supported in MATLAB R2018b and later.</p><p>**Example:** `modelCoverageCobertura: model-coverage/coverage.xml`</p>
`startupOptions`         | <p>(Optional) MATLAB startup options, specified as a list of options separated by spaces. For more information about startup options, see [Commonly Used Startup Options](https://www.mathworks.com/help/matlab/matlab_env/commonly-used-startup-options.html).<p/><p>Using this argument to specify the `-batch` or `-r` option is not supported.<p/><p>**Example:** `startupOptions: -nojvm`<br/>**Example:** `startupOptions: -nojvm -logfile output.log`</p>


>**Note:** To customize the pretest state of the system, you can specify startup code that automatically executes before your tests run. For information on how to specify startup or shutdown files in a MATLAB project, see [Automate Startup and Shutdown Tasks](https://www.mathworks.com/help/matlab/matlab_prog/automate-startup-and-shutdown-tasks.html). If your pipeline does not use a MATLAB project, specify the commands you want executed at startup in a `startup.m` file instead, and save the file to the root of your repository. See [`startup`](https://www.mathworks.com/help/matlab/ref/startup.html) for more information.

### Run MATLAB Command
Use the **Run MATLAB Command** task to run MATLAB scripts, functions, and statements. You can use this task to flexibly customize your test run or add a step in MATLAB to your pipeline. 

Specify the task in your pipeline YAML using the `RunMATLABCommand` key. The task requires an argument and also accepts an optional argument.

Argument                  | Description
------------------------- | ---------------
`command`                 | <p>(Required) Script, function, or statement to execute. If the value of `command` is the name of a MATLAB script or function, do not specify the file extension. If you specify more than one script, function, or statement, use a comma or semicolon to separate them.<p/><p>MATLAB exits with exit code 0 if the specified script, function, or statement executes successfully without error. Otherwise, MATLAB terminates with a nonzero exit code, which causes the task to fail. To fail the task in certain conditions, use the [`assert`](https://www.mathworks.com/help/matlab/ref/assert.html) or [`error`](https://www.mathworks.com/help/matlab/ref/error.html) function.<p/><p>**Example:** `command: myscript`<br/>**Example:** `command: results = runtests, assertSuccess(results);`</p>
`startupOptions`         | <p>(Optional) MATLAB startup options, specified as a list of options separated by spaces. For more information about startup options, see [Commonly Used Startup Options](https://www.mathworks.com/help/matlab/matlab_env/commonly-used-startup-options.html).<p/><p>Using this argument to specify the `-batch` or `-r` option is not supported.<p/><p>**Example:** `startupOptions: -nojvm`<br/>**Example:** `startupOptions: -nojvm -logfile output.log`</p>

When you use this task, all of the required files must be on the MATLAB search path. If your script or function is not in the root of your repository, you can use the [`addpath`](https://www.mathworks.com/help/matlab/ref/addpath.html), [`cd`](https://www.mathworks.com/help/matlab/ref/cd.html), or [`run`](https://www.mathworks.com/help/matlab/ref/run.html) function to put it on the path. For example, to run `myscript.m` in a folder named `myfolder` located in the root of the repository, you can specify `command` like this:

`command: addpath("myfolder"), myscript`

## Notes
* By default, when you use the **Run MATLAB Build**, **Run MATLAB Tests**, or **Run MATLAB Command** task, the root of your repository serves as the MATLAB startup folder. To run your MATLAB code using a different folder, specify the `-sd` startup option or include the `cd` command when using the **Run MATLAB Command** task.
* The **Run MATLAB Build** task uses the `-batch` option to invoke the [`buildtool`](https://www.mathworks.com/help/matlab/ref/buildtool.html) command. In addition, in MATLAB R2019a and later, the **Run MATLAB Tests** and **Run MATLAB Command** tasks use  the `-batch` option to start MATLAB noninteractively. Preferences do not persist across different MATLAB sessions launched with the `-batch` option. To run code that requires the same preferences, use a single task.

## See Also
- [Continuous Integration with MATLAB and Simulink](https://www.mathworks.com/solutions/continuous-integration.html)
- [Continuous Integration with MATLAB on CI Platforms](https://www.mathworks.com/help/matlab/matlab_prog/continuous-integration-with-matlab-on-ci-platforms.html)

## Contact Us
If you have any questions or suggestions, please contact MathWorks&reg; at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
